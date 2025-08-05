document.addEventListener('DOMContentLoaded', () => {
    
    const app = document.getElementById('app');
    const navLinks = document.getElementById('nav-links');
    const views = document.querySelectorAll('.view');
    const loader = document.getElementById('loader');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    
    const API_URL = 'https://clinicapi-back-production.up.railway.app'; // URL de tu backend Spring Boot

    
    let token = localStorage.getItem('token');
    let userRole = localStorage.getItem('userRole');

   

    
    const showLoader = () => loader.classList.remove('hidden');

    
    const hideLoader = () => loader.classList.add('hidden');

    /**
     * @param {string} title 
     * @param {string | HTMLElement} bodyContent
     * @param {Array<object>} [buttons=[]] 
     */
    const showModal = (title, bodyContent, buttons = []) => {
        modalTitle.textContent = title;
        if (typeof bodyContent === 'string') {
            modalBody.innerHTML = `<p>${bodyContent}</p>`;
        } else {
            modalBody.innerHTML = '';
            modalBody.appendChild(bodyContent);
        }
        
        modalFooter.innerHTML = '';
        if (buttons.length > 0) {
            buttons.forEach(btnInfo => {
                const button = document.createElement('button');
                button.textContent = btnInfo.text;
                button.className = btnInfo.classes;
                button.onclick = btnInfo.onClick;
                modalFooter.appendChild(button);
            });
        } else {
           
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Cerrar';
            closeButton.className = 'bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600';
            closeButton.onclick = hideModal;
            modalFooter.appendChild(closeButton);
        }

        modal.classList.remove('hidden');
        modal.classList.add('active');
        setTimeout(() => modalContent.classList.add('scale-100', 'opacity-100'), 10);
    };
    
    
    const hideModal = () => {
        modalContent.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }, 300);
    };

    /**
     * @param {string} endpoint
     * @param {object} options
     * @returns {Promise<any>} 
     */
    const fetchAPI = async (endpoint, options = {}) => {
        showLoader();
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                const errorMessage = Object.values(errorData).join('. ');
                throw new Error(errorMessage || 'Ocurrió un error en la petición.');
            }
            
    
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                return {};
            }

        } catch (error) {
            console.error('API Error:', error);
            showModal('Error de Conexión', error.message);
            throw error;
        } finally {
            hideLoader();
        }
    };

    /**
     * @param {string} viewId
     */
    const showView = (viewId) => {
        views.forEach(view => view.classList.add('hidden'));
        const activeView = document.getElementById(viewId);
        if(activeView) activeView.classList.remove('hidden');
    };

    
    const getRoleFromToken = (jwt) => {
        if (!jwt) return null;
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]));
            return payload.role;
        } catch (e) {
            console.error("Error decoding token", e);
            return null;
        }
    };

    
    const updateNav = () => {
        navLinks.innerHTML = '';
        if (token) {
            if (userRole === 'ADMIN') {
                navLinks.innerHTML = `
                    <a href="#" id="nav-admin" class="text-gray-700 hover:text-blue-600">Admin Panel</a>
                `;
            }
            navLinks.innerHTML += `
                <a href="#" id="nav-dashboard" class="text-gray-700 hover:text-blue-600">Mi Panel</a>
                <a href="#" id="nav-logout" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Cerrar Sesión</a>
            `;
        } else {
            navLinks.innerHTML = `
                <a href="#" id="nav-login" class="text-gray-700 hover:text-blue-600">Login</a>
                <a href="#" id="nav-register" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Registro</a>
            `;
        }
        addNavListeners();
    };

    const addNavListeners = () => {
        document.getElementById('nav-login')?.addEventListener('click', () => showView('login-view'));
        document.getElementById('nav-register')?.addEventListener('click', () => showView('register-view'));
        document.getElementById('nav-dashboard')?.addEventListener('click', () => {
            loadDashboardData();
            showView('dashboard-view');
        });
        document.getElementById('nav-admin')?.addEventListener('click', () => {
            loadAdminData();
            showView('admin-view');
        });
        document.getElementById('nav-logout')?.addEventListener('click', handleLogout);
    };

   
    const handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const data = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            token = data.token;
            userRole = getRoleFromToken(token);
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', userRole);
            updateNav();
            if (userRole === 'ADMIN') {
                loadAdminData();
                showView('admin-view');
            } else {
                loadDashboardData();
                showView('dashboard-view');
            }
            e.target.reset();
        } catch (error) {
        
        }
    };

    
    const handleRegister = async (e) => {
        e.preventDefault();
        const nombreCompleto = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            await fetchAPI('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ nombreCompleto, email, password })
            });
            showModal('Registro Exitoso', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.', [
                { text: 'Ir a Login', classes: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700', onClick: () => { hideModal(); showView('login-view'); } }
            ]);
            e.target.reset();
        } catch (error) {
        
        }
    };

    
    const handleLogout = () => {
        token = null;
        userRole = null;
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        updateNav();
        showView('login-view');
    };
    
    
    const loadDashboardData = () => {
        loadMisConsultas();
        loadMisEstudios();
        loadDoctoresParaSelect();
    };

  
    const loadMisConsultas = async () => {
        const content = document.getElementById('mis-consultas-content');
        try {
            const consultas = await fetchAPI('/api/consultas/mis-consultas');
            if (consultas.length === 0) {
                content.innerHTML = '<p class="text-gray-500">No tienes consultas agendadas.</p>';
                return;
            }
            content.innerHTML = consultas.map(c => `
                <div class="border-b p-4 last:border-b-0">
                    <p class="font-semibold">${c.motivo}</p>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-user-doctor mr-2"></i>Dr. ${c.doctorNombre} (${c.doctorEspecialidad})
                    </p>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-clock mr-2"></i>${new Date(c.fechaHora).toLocaleString('es-ES')}
                    </p>
                </div>
            `).join('');
        } catch (error) {
            content.innerHTML = '<p class="text-red-500">No se pudieron cargar las consultas.</p>';
        }
    };
    
    
    const loadMisEstudios = async () => {
        const content = document.getElementById('mis-estudios-content');
        content.innerHTML = '<p class="text-gray-500">Funcionalidad de estudios no implementada en el backend de ejemplo.</p>';
       
    };


    const loadDoctoresParaSelect = async () => {
        const select = document.getElementById('consulta-doctor');
        try {
            const doctores = await fetchAPI('/api/admin/doctores');
            select.innerHTML = '<option value="" disabled selected>Selecciona un doctor</option>';
            doctores.forEach(d => {
                select.innerHTML += `<option value="${d.id}">${d.nombreCompleto} - ${d.especialidad}</option>`;
            });
        } catch (error) {
            select.innerHTML = '<option>Error al cargar doctores</option>';
        }
    };
    

    const handleAgendarConsulta = async (e) => {
        e.preventDefault();
        const doctorId = document.getElementById('consulta-doctor').value;
        const fechaHora = document.getElementById('consulta-fecha').value;
        const motivo = document.getElementById('consulta-motivo').value;

        if (!doctorId || !fechaHora || !motivo) {
            showModal('Campos Incompletos', 'Por favor, rellena todos los campos.');
            return;
        }

        try {
            await fetchAPI('/api/consultas/agendar', {
                method: 'POST',
                body: JSON.stringify({ doctorId: parseInt(doctorId), fechaHora, motivo })
            });
            showModal('Éxito', 'Tu consulta ha sido agendada correctamente.');
            e.target.reset();
            loadMisConsultas(); 
        } catch (error) {
            
        }
    };

    
    const loadAdminData = () => {
        loadAdminDoctores();
    };


    const loadAdminDoctores = async () => {
        const content = document.getElementById('admin-doctores-content');
        try {
            const doctores = await fetchAPI('/api/admin/doctores');
            if (doctores.length === 0) {
                content.innerHTML = '<p class="text-gray-500">No hay doctores registrados.</p>';
                return;
            }
            content.innerHTML = `
                <table class="doctor-table w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre Completo</th>
                            <th>Especialidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${doctores.map(d => `
                            <tr>
                                <td>${d.id}</td>
                                <td>${d.nombreCompleto}</td>
                                <td>${d.especialidad}</td>
                                <td class="action-buttons">
                                    <button class="edit-btn" data-id="${d.id}" data-nombre="${d.nombreCompleto}" data-especialidad="${d.especialidad}"><i class="fas fa-edit"></i></button>
                                    <button class="delete-btn" data-id="${d.id}"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            addDoctorTableListeners();
        } catch (error) {
            content.innerHTML = '<p class="text-red-500">No se pudieron cargar los doctores.</p>';
        }
    };

 
    const addDoctorTableListeners = () => {
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const { id, nombre, especialidad } = e.currentTarget.dataset;
            showDoctorForm('Editar Doctor', { id, nombreCompleto: nombre, especialidad });
        }));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            handleDeleteDoctor(id);
        }));
    };


    const showDoctorForm = (title, doctor = null) => {
        const formId = 'doctor-form';
        const form = document.createElement('form');
        form.id = formId;
        form.innerHTML = `
            <div class="mb-4">
                <label for="doctor-nombre" class="block text-gray-700 mb-2">Nombre Completo</label>
                <input type="text" id="doctor-nombre" class="w-full px-4 py-2 border rounded-lg" value="${doctor?.nombreCompleto || ''}" required>
            </div>
            <div class="mb-4">
                <label for="doctor-especialidad" class="block text-gray-700 mb-2">Especialidad</label>
                <select id="doctor-especialidad" class="w-full px-4 py-2 border rounded-lg bg-white" required>
                    <option value="CARDIOLOGIA" ${doctor?.especialidad === 'CARDIOLOGIA' ? 'selected' : ''}>Cardiología</option>
                    <option value="TRAUMATOLOGIA" ${doctor?.especialidad === 'TRAUMATOLOGIA' ? 'selected' : ''}>Traumatología</option>
                    <option value="PEDIATRIA" ${doctor?.especialidad === 'PEDIATRIA' ? 'selected' : ''}>Pediatría</option>
                    <option value="RADIOLOGIA" ${doctor?.especialidad === 'RADIOLOGIA' ? 'selected' : ''}>Radiología</option>
                    <option value="LABORATORIO" ${doctor?.especialidad === 'LABORATORIO' ? 'selected' : ''}>Laboratorio</option>
                </select>
            </div>
        `;

        const submitHandler = async (e) => {
            e.preventDefault();
            const doctorData = {
                nombreCompleto: document.getElementById('doctor-nombre').value,
                especialidad: document.getElementById('doctor-especialidad').value,
            };
            try {
                if (doctor) { 
                    await fetchAPI(`/api/admin/doctores/${doctor.id}`, { method: 'PUT', body: JSON.stringify(doctorData) });
                } else { 
                    await fetchAPI('/api/admin/doctores', { method: 'POST', body: JSON.stringify(doctorData) });
                }
                hideModal();
                loadAdminDoctores();
            } catch (error) {
                
                const errorDiv = document.createElement('p');
                errorDiv.className = 'text-red-500 mt-2';
                errorDiv.textContent = error.message;
                form.appendChild(errorDiv);
            }
        };

        form.addEventListener('submit', submitHandler);

        showModal(title, form, [
            { text: 'Cancelar', classes: 'bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600', onClick: hideModal },
            { text: 'Guardar', classes: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700', onClick: () => form.dispatchEvent(new Event('submit', { cancelable: true })) }
        ]);
    };

    
    const handleDeleteDoctor = (id) => {
        showModal('Confirmar Eliminación', `¿Estás seguro de que quieres eliminar al doctor con ID ${id}? Esta acción no se puede deshacer.`, [
            { text: 'Cancelar', classes: 'bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600', onClick: hideModal },
            { text: 'Eliminar', classes: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700', onClick: async () => {
                try {
                    await fetchAPI(`/api/admin/doctores/${id}`, { method: 'DELETE' });
                    hideModal();
                    loadAdminDoctores();
                } catch (error) {
                    // El error ya se muestra en el modal principal
                }
            }}
        ]);
    };
    
   
    const handleGrantAdmin = async (e) => {
        e.preventDefault();
        const userId = document.getElementById('grant-admin-userid').value;
        if (!userId) {
            showModal('Error', 'Debes proporcionar un ID de usuario.');
            return;
        }
        try {
            const response = await fetchAPI(`/api/admin/usuarios/${userId}/grant-admin`, { method: 'PATCH' });
            showModal('Éxito', `Rol de administrador otorgado correctamente al usuario con ID ${userId}.`);
            e.target.reset();
        } catch (error) {
            // El error ya se muestra en el modal
        }
    };


    
    const init = () => {
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        document.getElementById('show-register-link').addEventListener('click', () => showView('register-view'));
        document.getElementById('show-login-link').addEventListener('click', () => showView('login-view'));
        document.getElementById('agendar-consulta-form').addEventListener('submit', handleAgendarConsulta);
        document.getElementById('add-doctor-btn').addEventListener('click', () => showDoctorForm('Añadir Nuevo Doctor'));
        document.getElementById('grant-admin-form').addEventListener('submit', handleGrantAdmin);

    
        updateNav();
        if (token) {
            if (userRole === 'ADMIN') {
                loadAdminData();
                showView('admin-view');
            } else {
                loadDashboardData();
                showView('dashboard-view');
            }
        } else {
            showView('login-view');
        }
    };

    init();
});
