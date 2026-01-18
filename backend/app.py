from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage for virtual network elements
virtual_elements = {}

# ============================================================================
# Network Element CRUD Operations
# ============================================================================

@app.route('/api/elements', methods=['GET'])
def get_elements():
    """Get all virtual network elements"""
    return jsonify(list(virtual_elements.values())), 200


@app.route('/api/elements', methods=['POST'])
def create_element():
    """Create a new virtual network element"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    element_id = str(uuid.uuid4())
    element = {
        'id': element_id,
        'name': data['name'],
        'description': data.get('description', ''),
        'type': data.get('type', 'Router'),
        'interfaces': [],
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    virtual_elements[element_id] = element
    return jsonify(element), 201


@app.route('/api/elements/<element_id>', methods=['GET'])
def get_element(element_id):
    """Get a specific virtual network element"""
    element = virtual_elements.get(element_id)
    if not element:
        return jsonify({'error': 'Element not found'}), 404
    return jsonify(element), 200


@app.route('/api/elements/<element_id>', methods=['PUT'])
def update_element(element_id):
    """Update a virtual network element"""
    element = virtual_elements.get(element_id)
    if not element:
        return jsonify({'error': 'Element not found'}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        element['name'] = data['name']
    if 'description' in data:
        element['description'] = data['description']
    if 'type' in data:
        element['type'] = data['type']
    
    element['updated_at'] = datetime.now().isoformat()
    virtual_elements[element_id] = element
    
    return jsonify(element), 200


@app.route('/api/elements/<element_id>', methods=['DELETE'])
def delete_element(element_id):
    """Delete a virtual network element"""
    if element_id not in virtual_elements:
        return jsonify({'error': 'Element not found'}), 404
    
    del virtual_elements[element_id]
    return jsonify({'message': 'Element deleted successfully'}), 200


# ============================================================================
# Interface Management (nested under elements)
# ============================================================================

@app.route('/api/elements/<element_id>/interfaces', methods=['GET'])
def get_interfaces(element_id):
    """Get all interfaces for a network element"""
    element = virtual_elements.get(element_id)
    if not element:
        return jsonify({'error': 'Element not found'}), 404
    
    return jsonify(element['interfaces']), 200


@app.route('/api/elements/<element_id>/interfaces', methods=['POST'])
def create_interface(element_id):
    """Create a new interface for a network element"""
    element = virtual_elements.get(element_id)
    if not element:
        return jsonify({'error': 'Element not found'}), 404
    
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Interface name is required'}), 400
    
    interface = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'type': data.get('type', 'Ethernet'),
        'ip_address': data.get('ip_address', ''),
        'mac_address': data.get('mac_address', ''),
        'status': data.get('status', 'up'),
        'bandwidth': data.get('bandwidth', ''),
        'level': data.get('level', 'L2'),  # L2, L3, or L2/L3
        'reverse_interface_id': data.get('reverse_interface_id', None),  # Reference to another interface
        'reverse_element_id': data.get('reverse_element_id', None),  # Element that contains reverse interface
        'created_at': datetime.now().isoformat()
    }
    
    element['interfaces'].append(interface)
    element['updated_at'] = datetime.now().isoformat()
    virtual_elements[element_id] = element
    
    return jsonify(interface), 201


@app.route('/api/elements/<element_id>/interfaces/<interface_id>', methods=['PUT'])
def update_interface(element_id, interface_id):
    """Update an interface"""
    element = virtual_elements.get(element_id)
    if not element:
        return jsonify({'error': 'Element not found'}), 404
    
    interface = next((i for i in element['interfaces'] if i['id'] == interface_id), None)
    if not interface:
        return jsonify({'error': 'Interface not found'}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        interface['name'] = data['name']
    if 'type' in data:
        interface['type'] = data['type']
    if 'ip_address' in data:
        interface['ip_address'] = data['ip_address']
    if 'mac_address' in data:
        interface['mac_address'] = data['mac_address']
    if 'status' in data:
        interface['status'] = data['status']
    if 'bandwidth' in data:
        interface['bandwidth'] = data['bandwidth']
    if 'level' in data:
        interface['level'] = data['level']  # L2, L3, or L2/L3
    if 'reverse_interface_id' in data:
        interface['reverse_interface_id'] = data['reverse_interface_id']
    if 'reverse_element_id' in data:
        interface['reverse_element_id'] = data['reverse_element_id']
    
    element['updated_at'] = datetime.now().isoformat()
    virtual_elements[element_id] = element
    
    return jsonify(interface), 200


@app.route('/api/elements/<element_id>/interfaces/<interface_id>', methods=['DELETE'])
def delete_interface(element_id, interface_id):
    """Delete an interface"""
    element = virtual_elements.get(element_id)
    if not element:
        return jsonify({'error': 'Element not found'}), 404
    
    interface_index = next((idx for idx, i in enumerate(element['interfaces']) if i['id'] == interface_id), None)
    if interface_index is None:
        return jsonify({'error': 'Interface not found'}), 404
    
    del element['interfaces'][interface_index]
    element['updated_at'] = datetime.now().isoformat()
    virtual_elements[element_id] = element
    
    return jsonify({'message': 'Interface deleted successfully'}), 200


# ============================================================================
# Connections/Links - Bidirectional references between interfaces
# ============================================================================

@app.route('/api/connections', methods=['GET'])
def get_connections():
    """Get all connections between interfaces"""
    connections = []
    
    for element_id, element in virtual_elements.items():
        for interface in element.get('interfaces', []):
            if interface.get('reverse_interface_id') and interface.get('reverse_element_id'):
                connection = {
                    'from_element_id': element_id,
                    'from_interface_id': interface['id'],
                    'from_interface_name': interface['name'],
                    'to_element_id': interface.get('reverse_element_id'),
                    'to_interface_id': interface.get('reverse_interface_id'),
                    'level': interface.get('level', 'L2')
                }
                # Only add if not duplicate (reverse direction already exists)
                if not any(
                    c['from_element_id'] == connection['to_element_id'] and
                    c['to_element_id'] == connection['from_element_id'] and
                    c['from_interface_id'] == interface.get('reverse_interface_id')
                    for c in connections
                ):
                    connections.append(connection)
    
    return jsonify(connections), 200


@app.route('/api/available-interfaces', methods=['GET'])
def get_available_interfaces():
    """Get all available interfaces for connection (excluding current element)"""
    element_id = request.args.get('element_id')
    interface_id = request.args.get('interface_id')  # Current interface to exclude
    
    available = []
    
    for elem_id, element in virtual_elements.items():
        # Skip current element
        if elem_id == element_id:
            continue
            
        for interface in element.get('interfaces', []):
            # Skip if already has a reverse connection
            if interface.get('reverse_interface_id'):
                continue
                
            available.append({
                'element_id': elem_id,
                'element_name': element['name'],
                'interface_id': interface['id'],
                'interface_name': interface['name'],
                'type': interface.get('type', 'Ethernet')
            })
    
    return jsonify(available), 200

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
