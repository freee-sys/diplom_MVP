import React, { useState } from 'react';
import './AccessControl.css';

const emptyRole = {
  id: null,
  name: '',
  description: '',
  permissions: []
};

const emptyUser = {
  id: null,
  username: '',
  password: '',
  roles: [],
  is_active: true
};

function AccessControl({
  roles,
  users,
  permissions,
  loading,
  canReadRoles,
  canWriteRoles,
  canReadUsers,
  canWriteUsers,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) {
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [roleError, setRoleError] = useState('');

  const [userForm, setUserForm] = useState(emptyUser);
  const [userError, setUserError] = useState('');

  const handleRoleToggle = (code) => {
    setRoleForm(prev => {
      const exists = prev.permissions.includes(code);
      const nextPermissions = exists
        ? prev.permissions.filter(p => p !== code)
        : [...prev.permissions, code];
      return { ...prev, permissions: nextPermissions };
    });
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    setRoleError('');

    if (!roleForm.name.trim()) {
      setRoleError('Role name is required');
      return;
    }

    const payload = {
      name: roleForm.name.trim(),
      description: roleForm.description,
      permissions: roleForm.permissions
    };

    if (roleForm.id) {
      onUpdateRole && onUpdateRole(roleForm.id, payload);
    } else {
      onCreateRole && onCreateRole(payload);
    }

    setRoleForm(emptyRole);
  };

  const handleEditRole = (role) => {
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    setUserError('');

    if (!userForm.username.trim()) {
      setUserError('Username is required');
      return;
    }

    if (!userForm.id && !userForm.password.trim()) {
      setUserError('Password is required');
      return;
    }

    const payload = {
      username: userForm.username.trim(),
      roles: userForm.roles,
      is_active: userForm.is_active
    };

    if (userForm.password.trim()) {
      payload.password = userForm.password.trim();
    }

    if (userForm.id) {
      onUpdateUser && onUpdateUser(userForm.id, payload);
    } else {
      onCreateUser && onCreateUser(payload);
    }

    setUserForm(emptyUser);
  };

  const handleEditUser = (user) => {
    setUserForm({
      id: user.id,
      username: user.username,
      password: '',
      roles: (user.roles || []).map(r => r.id),
      is_active: user.is_active
    });
  };

  return (
    <div className="access-layout">
      {loading && <div className="loading">Loading access data...</div>}

      {canReadRoles && (
        <div className="access-panel">
          <div className="panel-header">
            <h2>Roles</h2>
          </div>

          {canWriteRoles && (
            <form className="access-form" onSubmit={handleRoleSubmit}>
              {roleError && <div className="form-error">{roleError}</div>}
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div className="permission-grid">
                  {permissions.map(permission => (
                    <label key={permission.id} className="permission-item">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(permission.code)}
                        onChange={() => handleRoleToggle(permission.code)}
                      />
                      <span className="permission-code">{permission.code}</span>
                      <span className="permission-desc">{permission.description || ''}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {roleForm.id ? 'Update Role' : 'Create Role'}
                </button>
                {roleForm.id && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRoleForm(emptyRole)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="access-list">
            {roles.map(role => (
              <div key={role.id} className="access-item">
                <div>
                  <strong>{role.name}</strong>
                  <div className="muted">{role.description || 'No description'}</div>
                  <div className="muted">Permissions: {role.permissions?.length || 0}</div>
                </div>
                <div className="access-actions">
                  {canWriteRoles && role.name !== 'admin' && (
                    <button className="btn btn-secondary btn-small" onClick={() => handleEditRole(role)}>
                      Edit
                    </button>
                  )}
                  {canWriteRoles && role.name !== 'admin' && (
                    <button className="btn btn-danger btn-small" onClick={() => onDeleteRole && onDeleteRole(role.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canReadUsers && (
        <div className="access-panel">
          <div className="panel-header">
            <h2>Users</h2>
          </div>

          {canWriteUsers && (
            <form className="access-form" onSubmit={handleUserSubmit}>
              {userError && <div className="form-error">{userError}</div>}
              <div className="form-group">
                <label>Login</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={userForm.id ? 'Leave blank to keep current' : ''}
                />
              </div>
              <div className="form-group">
                <label>Roles</label>
                <div className="permission-grid">
                  {roles.map(role => (
                    <label key={role.id} className="permission-item">
                      <input
                        type="checkbox"
                        checked={userForm.roles.includes(role.id)}
                        onChange={() => {
                          const exists = userForm.roles.includes(role.id);
                          const nextRoles = exists
                            ? userForm.roles.filter(r => r !== role.id)
                            : [...userForm.roles, role.id];
                          setUserForm(prev => ({ ...prev, roles: nextRoles }));
                        }}
                      />
                      <span className="permission-code">{role.name}</span>
                      <span className="permission-desc">{role.description || ''}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {userForm.id ? 'Update User' : 'Create User'}
                </button>
                {userForm.id && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setUserForm(emptyUser)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="access-list">
            {users.map(user => (
              <div key={user.id} className="access-item">
                <div>
                  <strong>{user.username}</strong>
                  <div className="muted">Roles: {(user.roles || []).map(r => r.name).join(', ') || 'None'}</div>
                  <div className="muted">Status: {user.is_active ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="access-actions">
                  {canWriteUsers && !user.immutable && (
                    <button className="btn btn-secondary btn-small" onClick={() => handleEditUser(user)}>
                      Edit
                    </button>
                  )}
                  {canWriteUsers && !user.immutable && (
                    <button className="btn btn-danger btn-small" onClick={() => onDeleteUser && onDeleteUser(user.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessControl;
