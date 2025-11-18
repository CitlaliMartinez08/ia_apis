// --- CONFIGURACIÓN CRÍTICA ---
// DEBES REEMPLAZAR ESTA URL CON LA URL DEL WEBHOOK DE TU NODO DE INICIO EN N8N.
const N8N_WEBHOOK_URL = 'https://citma.app.n8n.cloud/webhook-test/e3f93b33-4a35-40d7-818f-624886d921fd';

const form = document.getElementById('calculationForm');
const expressionInput = document.getElementById('mathExpression');
const processButton = document.getElementById('processButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const buttonText = document.getElementById('buttonText');
const resultArea = document.getElementById('resultArea');
const ipDisplay = document.getElementById('ipDisplay');
const expressionDisplay = document.getElementById('expressionDisplay');
const messageDisplay = document.getElementById('messageDisplay');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const expression = expressionInput.value;
    
    // 1. Mostrar estado de carga
    setLoadingState(true);

    // 2. Obtener la IP pública del cliente
    let clientIp = 'IP_NO_DISPONIBLE';
    try {
        // Usamos un servicio externo para obtener la IP del cliente (el navegador)
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        clientIp = ipData.ip;
        
        displayMessage(`IP pública obtenida: ${clientIp}`, 'success');

    } catch (error) {
        console.error('Error al obtener la IP:', error);
        clientIp = 'Error al obtener la IP';
        displayMessage('Error al obtener la IP. Usando valor de respaldo.', 'danger');
    }

    // 3. Crear el payload con los datos necesarios
    const payload = {
        expression: expression,
        clientIp: clientIp,
        timestamp: new Date().toISOString()
    };

    // 4. Enviar los datos al Webhook de n8n
    await sendToN8N(payload);
    
    // 5. Ocultar estado de carga
    setLoadingState(false);
});

/**
 * Envía el payload de datos al Webhook de n8n.
 * @param {Object} payload - Los datos a enviar (expresión, IP, timestamp).
 */
async function sendToN8N(payload) {
    console.log('Enviando datos a n8n:', payload);
    
    // Actualizar el área de resultados con los datos que se enviarán
    resultArea.classList.remove('hidden');
    ipDisplay.textContent = `IP: ${payload.clientIp}`;
    expressionDisplay.textContent = `Operación: ${payload.expression}`;
    messageDisplay.className = 'text-sm font-medium'; // Reset style
    messageDisplay.textContent = 'Enviando al Workflow de n8n...';

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Respuesta de n8n:', data);
            displayMessage(`¡Envío exitoso! El workflow está en ejecución.`, 'success');
        } else {
            displayMessage(`Error en el servidor de n8n: ${response.statusText}. Verifica la URL del Webhook.`, 'warning');
            console.error('Error de respuesta del Webhook:', response.status);
        }

    } catch (error) {
        displayMessage('Error de conexión con el Webhook. Asegúrate de que n8n esté corriendo y la URL sea correcta.', 'danger');
        console.error('Error de fetch:', error);
    }
}

/**
 * Maneja el estado de carga del botón.
 * @param {boolean} isLoading - Si el botón debe estar en estado de carga.
 */
function setLoadingState(isLoading) {
    processButton.disabled = isLoading;
    if (isLoading) {
        loadingSpinner.classList.remove('visually-hidden');
        buttonText.textContent = 'Procesando...';
    } else {
        loadingSpinner.classList.add('visually-hidden');
        buttonText.textContent = 'Procesar y Enviar a n8n';
    }
}

/**
 * Muestra un mensaje en el área de resultados con un estilo específico.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - Tipo de mensaje ('success', 'danger', 'warning').
 */
function displayMessage(message, type) {
    resultArea.classList.remove('hidden');
    let colorClass = '';
    switch (type) {
        case 'success':
            colorClass = 'text-green-600';
            break;
        case 'danger':
            colorClass = 'text-red-600';
            break;
        case 'warning':
            colorClass = 'text-yellow-600';
            break;
        default:
            colorClass = 'text-gray-600';
    }
    messageDisplay.textContent = message;
    messageDisplay.classList.add(colorClass);
}