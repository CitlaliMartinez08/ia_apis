
const N8N_WEBHOOK_URL = 'https://citma.app.n8n.cloud/webhook-test/e3f93b33-4a35-40d7-818f-624886d921fd';

const form = document.getElementById('calculationForm');
const expressionInput = document.getElementById('mathExpression');
const processButton = document.getElementById('processButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const buttonText = document.getElementById('buttonText');
const resultArea = document.getElementById('resultArea');
const ipDisplay = document.getElementById('ipDisplay');
const expressionDisplay = document.getElementById('expressionDisplay');
// 🟢 NUEVAS CONSTANTES
const resultDisplay = document.getElementById('resultDisplay');
const messageDisplay = document.getElementById('messageDisplay');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const expression = expressionInput.value;
    
    // 1. Ocultar resultado anterior y mostrar estado de carga
    setLoadingState(true);
    resultDisplay.classList.add('hidden'); // Ocultar resultado anterior
    resultDisplay.textContent = ''; // Limpiar texto

    // 2. Obtener la IP pública del cliente
    let clientIp = 'IP_NO_DISPONIBLE';
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        clientIp = ipData.ip;
        
    } catch (error) {
        console.error('Error al obtener la IP:', error);
        clientIp = 'Error al obtener la IP';
        
    }

    // 3. Crear el payload con los datos necesarios
    const payload = {
        expression: expression,
        clientIp: clientIp,
        timestamp: new Date().toISOString()
    };

    // 4. Enviar los datos al Webhook de n8n y esperar la respuesta
    await sendToN8N(payload);
    
    // 5. Ocultar estado de carga
    setLoadingState(false);
});

/**
 * Envía el payload de datos al Webhook de n8n y procesa el resultado.
 * @param {Object} payload - Los datos a enviar (expresión, IP, timestamp).
 */
async function sendToN8N(payload) {
    console.log('Enviando datos a n8n:', payload);
    
    // Actualizar el área de resultados con los datos que se enviarán
    resultArea.classList.remove('hidden');
    ipDisplay.textContent = `IP: ${payload.clientIp}`;
    expressionDisplay.textContent = `Operación: ${payload.expression}`;
    messageDisplay.className = 'text-sm font-medium'; // Reset style
    messageDisplay.textContent = 'Enviando al Workflow de n8n y esperando cálculo...';

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
            
            // 🟢 CLAVE: PROCESAR EL RESULTADO DEVUELTO POR N8N 🟢
            if (data && data.result !== undefined) {
                // Muestra el resultado de forma destacada
                resultDisplay.textContent = `Resultado: ${data.result}`;
                resultDisplay.classList.remove('hidden');
                displayMessage(`¡Cálculo exitoso! El resultado es ${data.result}.`, 'success');
            } else {
                // Si la respuesta es OK pero no tiene el campo 'result'
                displayMessage(`¡Envío exitoso! El workflow terminó, pero no se recibió el campo 'result'.`, 'warning');
            }
            
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
    // Nota: resultArea ya se ha hecho visible en sendToN8N
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
    // Aseguramos que messageDisplay solo tiene un color de texto
    messageDisplay.classList.remove('text-green-600', 'text-red-600', 'text-yellow-600', 'text-gray-600');
    messageDisplay.textContent = message;
    messageDisplay.classList.add(colorClass);
}
