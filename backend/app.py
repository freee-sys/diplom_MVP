import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional

from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
import jwt
from dotenv import load_dotenv

# Optional GOST hashing
try:
    from pygost.gost34112012 import GOST34112012

    def gost_hash(value: str) -> str:
        return GOST34112012(value.encode("utf-8")).digest().hex()

except Exception:

    def gost_hash(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "virtual_network")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

raw_database_url = os.getenv("DATABASE_URL")
if raw_database_url:
    if raw_database_url.startswith("postgres://"):
        raw_database_url = raw_database_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_database_url.startswith("postgresql://"):
        raw_database_url = raw_database_url.replace("postgresql://", "postgresql+psycopg://", 1)

explicit_db_config = all([DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD])
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    if explicit_db_config
    else raw_database_url
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))

db = SQLAlchemy(app)


# ---------------------------------------------------------------------------
# RBAC + Audit Models
# ---------------------------------------------------------------------------
user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.String(36), db.ForeignKey("users.id"), primary_key=True),
    db.Column("role_id", db.String(36), db.ForeignKey("roles.id"), primary_key=True),
)

role_permissions = db.Table(
    "role_permissions",
    db.Column("role_id", db.String(36), db.ForeignKey("roles.id"), primary_key=True),
    db.Column("permission_id", db.String(36), db.ForeignKey("permissions.id"), primary_key=True),
)


class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(128), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    permissions = db.relationship("Permission", secondary=role_permissions, lazy="joined")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    immutable = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    roles = db.relationship("Role", secondary=user_roles, lazy="joined")


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_id = db.Column(db.String(36), nullable=True)
    username = db.Column(db.String(128), nullable=True)
    method = db.Column(db.String(10), nullable=False)
    path = db.Column(db.String(255), nullable=False)
    endpoint = db.Column(db.String(128), nullable=True)
    status_code = db.Column(db.Integer, nullable=False)
    ip_address = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    request_body = db.Column(db.Text, nullable=True)


# ---------------------------------------------------------------------------
# Topology models (DB-backed)
# ---------------------------------------------------------------------------
class NetworkElement(db.Model):
    __tablename__ = "network_elements"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(64), nullable=False, default="Router")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    interfaces = db.relationship(
        "NetworkInterface",
        backref="element",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class NetworkInterface(db.Model):
    __tablename__ = "network_interfaces"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    element_id = db.Column(db.String(36), db.ForeignKey("network_elements.id"), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    type = db.Column(db.String(64), nullable=False, default="Ethernet")
    ip_address = db.Column(db.String(64), nullable=True)
    mac_address = db.Column(db.String(64), nullable=True)
    status = db.Column(db.String(32), nullable=False, default="up")
    bandwidth = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class NetworkLink(db.Model):
    __tablename__ = "network_links"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    element_a_id = db.Column(db.String(36), db.ForeignKey("network_elements.id"), nullable=False)
    interface_a_id = db.Column(db.String(36), db.ForeignKey("network_interfaces.id"), nullable=False)
    element_b_id = db.Column(db.String(36), db.ForeignKey("network_elements.id"), nullable=False)
    interface_b_id = db.Column(db.String(36), db.ForeignKey("network_interfaces.id"), nullable=False)
    level = db.Column(db.String(8), nullable=False, default="L2")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
SENSITIVE_KEYS = {"password", "password_hash", "token", "refresh_token", "secret", "authorization"}


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def user_public(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "immutable": user.immutable,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        "roles": [{"id": r.id, "name": r.name} for r in user.roles],
    }


def role_public(role: Role) -> dict:
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "created_at": role.created_at.isoformat(),
        "permissions": [p.code for p in role.permissions],
    }


def interface_to_dict(interface: NetworkInterface) -> dict:
    return {
        "id": interface.id,
        "name": interface.name,
        "type": interface.type,
        "ip_address": interface.ip_address or "",
        "mac_address": interface.mac_address or "",
        "status": interface.status,
        "bandwidth": interface.bandwidth or "",
        "created_at": interface.created_at.isoformat(),
    }


def element_to_dict(element: NetworkElement, include_interfaces: bool = True) -> dict:
    payload = {
        "id": element.id,
        "name": element.name,
        "description": element.description or "",
        "type": element.type,
        "created_at": element.created_at.isoformat(),
        "updated_at": element.updated_at.isoformat(),
    }
    if include_interfaces:
        payload["interfaces"] = [interface_to_dict(i) for i in element.interfaces]
    return payload


def link_to_dict(link: NetworkLink) -> dict:
    return {
        "id": link.id,
        "element_a_id": link.element_a_id,
        "interface_a_id": link.interface_a_id,
        "element_b_id": link.element_b_id,
        "interface_b_id": link.interface_b_id,
        "level": link.level,
        "created_at": link.created_at.isoformat(),
        "updated_at": link.updated_at.isoformat(),
    }


def sanitize_payload(payload):
    if isinstance(payload, dict):
        cleaned = {}
        for key, value in payload.items():
            if str(key).lower() in SENSITIVE_KEYS:
                cleaned[key] = "***"
            else:
                cleaned[key] = sanitize_payload(value)
        return cleaned
    if isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    return payload


def get_permission_codes(user: User) -> set:
    codes = set()
    for role in user.roles:
        for permission in role.permissions:
            codes.add(permission.code)
    return codes


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "username": user.username,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRES_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def extract_bearer_token() -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = extract_bearer_token()
        if not token:
            return jsonify({"error": "authentication required"}), 401

        try:
            payload = decode_access_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "token expired"}), 401
        except Exception:
            return jsonify({"error": "invalid token"}), 401

        user = db.session.get(User, payload.get("sub"))
        if not user or not user.is_active:
            return jsonify({"error": "invalid user"}), 401

        g.current_user = user
        g.permission_codes = get_permission_codes(user)
        return f(*args, **kwargs)

    return wrapper


def require_permission(permission_code: str):
    def decorator(f):
        @wraps(f)
        @auth_required
        def wrapper(*args, **kwargs):
            permissions = getattr(g, "permission_codes", set())
            if "*" in permissions or permission_code in permissions:
                return f(*args, **kwargs)
            return jsonify({"error": f"permission denied: {permission_code}"}), 403

        return wrapper

    return decorator


def resolve_roles(role_refs):
    roles = []
    if not role_refs:
        operator_role = Role.query.filter_by(name="operator").first()
        return [operator_role] if operator_role else []

    for ref in role_refs:
        role = db.session.get(Role, ref)
        if not role:
            role = Role.query.filter_by(name=ref).first()
        if role:
            roles.append(role)
    return roles


# ---------------------------------------------------------------------------
# Audit Middleware
# ---------------------------------------------------------------------------
@app.before_request
def before_request():
    g.request_ts = datetime.utcnow()
    g.audit_user_id = None
    g.audit_username = None

    raw_body = request.get_data(as_text=True, cache=True)
    body_for_log = None
    if raw_body:
        if request.is_json:
            try:
                body_for_log = sanitize_payload(request.get_json(silent=True) or {})
            except Exception:
                body_for_log = "<invalid json>"
        else:
            body_for_log = raw_body[:5000]
    g.request_body = body_for_log

    token = extract_bearer_token()
    if token:
        try:
            payload = decode_access_token(token)
            g.audit_user_id = payload.get("sub")
            g.audit_username = payload.get("username")
        except Exception:
            pass


@app.after_request
def after_request(response):
    # Do not fail business response if audit insert fails.
    try:
        user = getattr(g, "current_user", None)
        log_user_id = user.id if user else getattr(g, "audit_user_id", None)
        log_username = user.username if user else getattr(g, "audit_username", None)

        if request.path == "/api/auth/login" and request.is_json:
            body = sanitize_payload(request.get_json(silent=True) or {})
        else:
            body = getattr(g, "request_body", None)

        log_entry = AuditLog(
            user_id=log_user_id,
            username=log_username,
            method=request.method,
            path=request.path,
            endpoint=request.endpoint,
            status_code=response.status_code,
            ip_address=request.headers.get("X-Forwarded-For", request.remote_addr),
            user_agent=(request.headers.get("User-Agent") or "")[:255],
            request_body=(str(body) if body is not None else None)[:5000],
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception:
        db.session.rollback()

    return response


# ---------------------------------------------------------------------------
# Initialization and seed data
# ---------------------------------------------------------------------------
def seed_initial_data():
    permission_seed = [
        ("*", "Full access"),
        (
            "elements.read",
            "GET /api/elements, /api/elements/<id>, /api/elements/<id>/interfaces",
        ),
        (
            "elements.write",
            "POST/PUT/DELETE /api/elements and /api/elements/<id>/interfaces",
        ),
        ("links.read", "GET /api/links, /api/links/<id>"),
        ("links.write", "POST/PUT/DELETE /api/links"),
        ("topology.read", "View topology UI (requires elements.read + links.read)"),
        ("users.read", "GET /api/users"),
        ("users.write", "POST/PUT/DELETE /api/users"),
        ("roles.read", "GET /api/roles, /api/permissions"),
        ("roles.write", "POST/PUT/DELETE /api/roles"),
        ("audit.read", "GET /api/audit-logs"),
    ]

    for code, description in permission_seed:
        exists = Permission.query.filter_by(code=code).first()
        if not exists:
            db.session.add(Permission(code=code, description=description))
        elif description and exists.description != description:
            exists.description = description
    db.session.commit()

    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="System administrator")
        db.session.add(admin_role)

    operator_role = Role.query.filter_by(name="operator").first()
    if not operator_role:
        operator_role = Role(name="operator", description="Network operator")
        db.session.add(operator_role)
    db.session.commit()

    full_access = Permission.query.filter_by(code="*").first()
    if full_access and full_access not in admin_role.permissions:
        admin_role.permissions.append(full_access)

    operator_codes = ["elements.read", "elements.write", "links.read", "links.write", "topology.read"]
    operator_permissions = Permission.query.filter(Permission.code.in_(operator_codes)).all()
    for permission in operator_permissions:
        if permission not in operator_role.permissions:
            operator_role.permissions.append(permission)

    db.session.commit()

    admin_user = User.query.filter_by(username="admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            password_hash=gost_hash("admin"),
            immutable=True,
            is_active=True,
        )
        admin_user.roles.append(admin_role)
        db.session.add(admin_user)

    operator_user = User.query.filter_by(username="operator").first()
    if not operator_user:
        operator_user = User(
            username="operator",
            password_hash=gost_hash("password1"),
            immutable=False,
            is_active=True,
        )
        operator_user.roles.append(operator_role)
        db.session.add(operator_user)

    db.session.commit()


with app.app_context():
    db.create_all()
    seed_initial_data()


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or user.password_hash != gost_hash(password):
        return jsonify({"error": "invalid credentials"}), 401

    if not user.is_active:
        return jsonify({"error": "user is inactive"}), 403

    token = create_access_token(user)
    permissions = sorted(get_permission_codes(user))

    # Fill audit identity for this request before after_request hook runs.
    g.audit_user_id = user.id
    g.audit_username = user.username

    return jsonify(
        {
            "access_token": token,
            "expires_in_minutes": JWT_EXPIRES_MINUTES,
            "user": user_public(user),
            "permissions": permissions,
        }
    ), 200


@app.route("/api/auth/me", methods=["GET"])
@auth_required
def auth_me():
    user = g.current_user
    return jsonify({"user": user_public(user), "permissions": sorted(get_permission_codes(user))}), 200


# ---------------------------------------------------------------------------
# Permissions, roles, users
# ---------------------------------------------------------------------------
@app.route("/api/permissions", methods=["GET"])
@require_permission("roles.read")
def list_permissions():
    permissions = Permission.query.order_by(Permission.code.asc()).all()
    return jsonify([
        {"id": p.id, "code": p.code, "description": p.description} for p in permissions
    ]), 200


@app.route("/api/roles", methods=["GET"])
@require_permission("roles.read")
def list_roles():
    roles = Role.query.order_by(Role.name.asc()).all()
    return jsonify([role_public(role) for role in roles]), 200


@app.route("/api/roles", methods=["POST"])
@require_permission("roles.write")
def create_role():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "role name is required"}), 400

    if Role.query.filter_by(name=name).first():
        return jsonify({"error": "role already exists"}), 400

    permission_codes = data.get("permissions") or []
    permissions = Permission.query.filter(Permission.code.in_(permission_codes)).all()

    role = Role(name=name, description=data.get("description"))
    role.permissions = permissions
    db.session.add(role)
    db.session.commit()

    return jsonify(role_public(role)), 201


@app.route("/api/roles/<role_id>", methods=["PUT"])
@require_permission("roles.write")
def update_role(role_id):
    role = db.session.get(Role, role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    data = request.get_json() or {}

    if "name" in data:
        new_name = (data.get("name") or "").strip()
        if not new_name:
            return jsonify({"error": "role name cannot be empty"}), 400
        exists = Role.query.filter(Role.name == new_name, Role.id != role.id).first()
        if exists:
            return jsonify({"error": "role name already used"}), 400
        role.name = new_name

    if "description" in data:
        role.description = data.get("description")

    if "permissions" in data:
        permission_codes = data.get("permissions") or []
        role.permissions = Permission.query.filter(Permission.code.in_(permission_codes)).all()

    db.session.commit()
    return jsonify(role_public(role)), 200


@app.route("/api/roles/<role_id>", methods=["DELETE"])
@require_permission("roles.write")
def delete_role(role_id):
    role = db.session.get(Role, role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    if role.name == "admin":
        return jsonify({"error": "admin role is immutable"}), 403

    db.session.delete(role)
    db.session.commit()
    return jsonify({"message": "role deleted"}), 200


@app.route("/api/users", methods=["GET"])
@require_permission("users.read")
def list_users():
    users = User.query.order_by(User.username.asc()).all()
    return jsonify([user_public(user) for user in users]), 200


@app.route("/api/users", methods=["POST"])
@require_permission("users.write")
def create_user():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "username already exists"}), 400

    roles = resolve_roles(data.get("roles") or [])

    user = User(
        username=username,
        password_hash=gost_hash(password),
        immutable=False,
        is_active=True,
    )
    user.roles = roles
    db.session.add(user)
    db.session.commit()

    return jsonify(user_public(user)), 201


@app.route("/api/users/<user_id>", methods=["PUT"])
@require_permission("users.write")
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    if user.immutable:
        return jsonify({"error": "user is immutable"}), 403

    data = request.get_json() or {}

    if "password" in data and data.get("password"):
        user.password_hash = gost_hash(data["password"])

    if "roles" in data:
        user.roles = resolve_roles(data.get("roles") or [])

    if "is_active" in data:
        user.is_active = bool(data.get("is_active"))

    db.session.commit()
    return jsonify(user_public(user)), 200


@app.route("/api/users/<user_id>", methods=["DELETE"])
@require_permission("users.write")
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    if user.immutable:
        return jsonify({"error": "user is immutable"}), 403

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "user deleted"}), 200


# ---------------------------------------------------------------------------
# Audit logs
# ---------------------------------------------------------------------------
@app.route("/api/audit-logs", methods=["GET"])
@require_permission("audit.read")
def get_audit_logs():
    query = AuditLog.query

    username = request.args.get("username")
    method = request.args.get("method")
    path = request.args.get("path")
    status_code = request.args.get("status_code")

    if username:
        query = query.filter(AuditLog.username == username)
    if method:
        query = query.filter(AuditLog.method == method.upper())
    if path:
        query = query.filter(AuditLog.path.like(f"%{path}%"))
    if status_code and status_code.isdigit():
        query = query.filter(AuditLog.status_code == int(status_code))

    limit = min(int(request.args.get("limit", 100)), 500)
    offset = max(int(request.args.get("offset", 0)), 0)

    total = query.count()
    rows = query.order_by(AuditLog.id.desc()).offset(offset).limit(limit).all()

    return jsonify(
        {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "id": row.id,
                    "created_at": row.created_at.isoformat(),
                    "user_id": row.user_id,
                    "username": row.username,
                    "method": row.method,
                    "path": row.path,
                    "endpoint": row.endpoint,
                    "status_code": row.status_code,
                    "ip_address": row.ip_address,
                    "user_agent": row.user_agent,
                    "request_body": row.request_body,
                }
                for row in rows
            ],
        }
    ), 200


# ---------------------------------------------------------------------------
# Seed example topology (in-memory)
# ---------------------------------------------------------------------------
@app.route("/api/seed", methods=["POST"])
@require_permission("elements.write")
def seed_topology():
    data = request.get_json() or {}
    clear_existing = bool(data.get("clear", True))

    if clear_existing:
        NetworkLink.query.delete()
        NetworkInterface.query.delete()
        NetworkElement.query.delete()
        db.session.commit()

    types = [
        "Router",
        "Switch",
        "Firewall",
        "Gateway",
        "Router",
        "Switch",
        "Router",
        "Firewall",
        "Switch",
        "Gateway",
    ]

    elements = []
    element_ids = []
    for idx in range(10):
        element = NetworkElement(
            id=str(uuid.uuid4()),
            name=f"Node-{idx + 1}",
            description=f"Sample element {idx + 1}",
            type=types[idx % len(types)],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        for iface_name in ["eth0", "eth1", "eth2"]:
            interface = NetworkInterface(
                id=str(uuid.uuid4()),
                name=iface_name,
                type="Ethernet",
                ip_address="",
                mac_address="",
                status="up",
                bandwidth="",
                created_at=datetime.utcnow(),
            )
            element.interfaces.append(interface)

        elements.append(element)
        element_ids.append(element.id)
        db.session.add(element)

    def iface_id(element_id: str, iface_name: str) -> str:
        element = next(el for el in elements if el.id == element_id)
        for iface in element.interfaces:
            if iface.name == iface_name:
                return iface.id
        raise ValueError("interface not found")

    link_pairs = [
        (0, "eth0", 1, "eth0", "L2"),
        (1, "eth1", 2, "eth0", "L3"),
        (2, "eth1", 3, "eth0", "L2"),
        (3, "eth1", 4, "eth0", "L3"),
        (4, "eth1", 5, "eth0", "L2"),
        (5, "eth1", 6, "eth0", "L3"),
        (6, "eth1", 7, "eth0", "L2"),
        (7, "eth1", 8, "eth0", "L3"),
        (8, "eth1", 9, "eth0", "L2"),
        (0, "eth1", 4, "eth2", "L3"),
        (2, "eth2", 6, "eth2", "L2"),
        (1, "eth2", 7, "eth2", "L3"),
    ]

    for a_idx, a_iface, b_idx, b_iface, level in link_pairs:
        link = NetworkLink(
            id=str(uuid.uuid4()),
            element_a_id=element_ids[a_idx],
            interface_a_id=iface_id(element_ids[a_idx], a_iface),
            element_b_id=element_ids[b_idx],
            interface_b_id=iface_id(element_ids[b_idx], b_iface),
            level=level,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(link)

    db.session.commit()

    return jsonify(
        {
            "message": "seeded",
            "elements": len(elements),
            "links": len(link_pairs),
        }
    ), 201


# ---------------------------------------------------------------------------
# Network Element CRUD Operations
# ---------------------------------------------------------------------------
@app.route("/api/elements", methods=["GET"])
@require_permission("elements.read")
def get_elements():
    elements = NetworkElement.query.options(joinedload(NetworkElement.interfaces)).all()
    return jsonify([element_to_dict(el) for el in elements]), 200


@app.route("/api/elements", methods=["POST"])
@require_permission("elements.write")
def create_element():
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400

    element = NetworkElement(
        id=str(uuid.uuid4()),
        name=data["name"],
        description=data.get("description", ""),
        type=data.get("type", "Router"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(element)
    db.session.commit()
    return jsonify(element_to_dict(element)), 201


@app.route("/api/elements/<element_id>", methods=["GET"])
@require_permission("elements.read")
def get_element(element_id):
    element = NetworkElement.query.options(joinedload(NetworkElement.interfaces)).filter_by(id=element_id).first()
    if not element:
        return jsonify({"error": "Element not found"}), 404
    return jsonify(element_to_dict(element)), 200


@app.route("/api/elements/<element_id>", methods=["PUT"])
@require_permission("elements.write")
def update_element(element_id):
    element = NetworkElement.query.options(joinedload(NetworkElement.interfaces)).filter_by(id=element_id).first()
    if not element:
        return jsonify({"error": "Element not found"}), 404

    data = request.get_json() or {}

    if "name" in data:
        element.name = data["name"]
    if "description" in data:
        element.description = data["description"]
    if "type" in data:
        element.type = data["type"]

    element.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(element_to_dict(element)), 200


@app.route("/api/elements/<element_id>", methods=["DELETE"])
@require_permission("elements.write")
def delete_element(element_id):
    element = NetworkElement.query.filter_by(id=element_id).first()
    if not element:
        return jsonify({"error": "Element not found"}), 404

    NetworkLink.query.filter(
        or_(NetworkLink.element_a_id == element_id, NetworkLink.element_b_id == element_id)
    ).delete(synchronize_session=False)
    db.session.delete(element)
    db.session.commit()
    return jsonify({"message": "Element deleted successfully"}), 200


# ---------------------------------------------------------------------------
# Interface Management
# ---------------------------------------------------------------------------
@app.route("/api/elements/<element_id>/interfaces", methods=["GET"])
@require_permission("elements.read")
def get_interfaces(element_id):
    element = NetworkElement.query.options(joinedload(NetworkElement.interfaces)).filter_by(id=element_id).first()
    if not element:
        return jsonify({"error": "Element not found"}), 404

    return jsonify([interface_to_dict(i) for i in element.interfaces]), 200


@app.route("/api/elements/<element_id>/interfaces", methods=["POST"])
@require_permission("elements.write")
def create_interface(element_id):
    element = NetworkElement.query.filter_by(id=element_id).first()
    if not element:
        return jsonify({"error": "Element not found"}), 404

    data = request.get_json() or {}

    if "name" not in data:
        return jsonify({"error": "Interface name is required"}), 400

    interface = NetworkInterface(
        id=str(uuid.uuid4()),
        element_id=element.id,
        name=data["name"],
        type=data.get("type", "Ethernet"),
        ip_address=data.get("ip_address", ""),
        mac_address=data.get("mac_address", ""),
        status=data.get("status", "up"),
        bandwidth=data.get("bandwidth", ""),
        created_at=datetime.utcnow(),
    )
    db.session.add(interface)
    element.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(interface_to_dict(interface)), 201


@app.route("/api/elements/<element_id>/interfaces/<interface_id>", methods=["PUT"])
@require_permission("elements.write")
def update_interface(element_id, interface_id):
    interface = NetworkInterface.query.filter_by(id=interface_id, element_id=element_id).first()
    if not interface:
        return jsonify({"error": "Interface not found"}), 404

    data = request.get_json() or {}

    if "name" in data:
        interface.name = data["name"]
    if "type" in data:
        interface.type = data["type"]
    if "ip_address" in data:
        interface.ip_address = data["ip_address"]
    if "mac_address" in data:
        interface.mac_address = data["mac_address"]
    if "status" in data:
        interface.status = data["status"]
    if "bandwidth" in data:
        interface.bandwidth = data["bandwidth"]

    element = NetworkElement.query.filter_by(id=element_id).first()
    if element:
        element.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(interface_to_dict(interface)), 200


@app.route("/api/elements/<element_id>/interfaces/<interface_id>", methods=["DELETE"])
@require_permission("elements.write")
def delete_interface(element_id, interface_id):
    interface = NetworkInterface.query.filter_by(id=interface_id, element_id=element_id).first()
    if not interface:
        return jsonify({"error": "Interface not found"}), 404

    NetworkLink.query.filter(
        or_(NetworkLink.interface_a_id == interface_id, NetworkLink.interface_b_id == interface_id)
    ).delete(synchronize_session=False)

    db.session.delete(interface)

    element = NetworkElement.query.filter_by(id=element_id).first()
    if element:
        element.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Interface deleted successfully"}), 200


# ---------------------------------------------------------------------------
# Link Management
# ---------------------------------------------------------------------------
@app.route("/api/links", methods=["GET"])
@require_permission("links.read")
def get_links():
    items = NetworkLink.query.all()
    return jsonify([link_to_dict(item) for item in items]), 200


@app.route("/api/links", methods=["POST"])
@require_permission("links.write")
def create_link():
    data = request.get_json() or {}
    required = ["element_a_id", "interface_a_id", "element_b_id", "interface_b_id", "level"]
    if not all(key in data for key in required):
        return jsonify({"error": "Missing required link fields"}), 400

    element_a = NetworkElement.query.filter_by(id=data["element_a_id"]).first()
    element_b = NetworkElement.query.filter_by(id=data["element_b_id"]).first()
    if not element_a or not element_b:
        return jsonify({"error": "One or both elements not found"}), 404

    interface_a = NetworkInterface.query.filter_by(id=data["interface_a_id"], element_id=element_a.id).first()
    interface_b = NetworkInterface.query.filter_by(id=data["interface_b_id"], element_id=element_b.id).first()
    if not interface_a or not interface_b:
        return jsonify({"error": "One or both interfaces not found"}), 404

    if data["level"] not in ("L2", "L3"):
        return jsonify({"error": "Invalid link level"}), 400

    same_pair = NetworkLink.query.filter(
        or_(
            (
                (NetworkLink.element_a_id == data["element_a_id"])
                & (NetworkLink.interface_a_id == data["interface_a_id"])
                & (NetworkLink.element_b_id == data["element_b_id"])
                & (NetworkLink.interface_b_id == data["interface_b_id"])
            ),
            (
                (NetworkLink.element_a_id == data["element_b_id"])
                & (NetworkLink.interface_a_id == data["interface_b_id"])
                & (NetworkLink.element_b_id == data["element_a_id"])
                & (NetworkLink.interface_b_id == data["interface_a_id"])
            ),
        )
    ).first()
    if same_pair:
        return jsonify({"error": "Link already exists between these interfaces"}), 400

    link = NetworkLink(
        id=str(uuid.uuid4()),
        element_a_id=data["element_a_id"],
        interface_a_id=data["interface_a_id"],
        element_b_id=data["element_b_id"],
        interface_b_id=data["interface_b_id"],
        level=data["level"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(link)
    db.session.commit()
    return jsonify(link_to_dict(link)), 201


@app.route("/api/links/<link_id>", methods=["GET"])
@require_permission("links.read")
def get_link(link_id):
    link = NetworkLink.query.filter_by(id=link_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404
    return jsonify(link_to_dict(link)), 200


@app.route("/api/links/<link_id>", methods=["PUT"])
@require_permission("links.write")
def update_link(link_id):
    link = NetworkLink.query.filter_by(id=link_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    data = request.get_json() or {}
    if "level" in data:
        if data["level"] not in ("L2", "L3"):
            return jsonify({"error": "Invalid link level"}), 400
        link.level = data["level"]

    link.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(link_to_dict(link)), 200


@app.route("/api/links/<link_id>", methods=["DELETE"])
@require_permission("links.write")
def delete_link(link_id):
    link = NetworkLink.query.filter_by(id=link_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    db.session.delete(link)
    db.session.commit()
    return jsonify({"message": "Link deleted successfully"}), 200


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
>>>>>>> b66182a (Add RBAC UI, topology drag, and DB persistence)
def health():
    return jsonify({"status": "healthy"}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
