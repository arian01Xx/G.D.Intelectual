const canvas = document.getElementById("brain");
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const neurons = [];
        const connections = [];

        // Genera neuronas aleatorias
        for (let i = 0; i < 50; i++) {
            neurons.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 5,
                vx: (Math.random() - 0.5) * 0.5, // Velocidad en X
                vy: (Math.random() - 0.5) * 0.5, // Velocidad en Y
                active: false, // Estado de actividad
                activationTime: 0 // Tiempo de activación
            });
        }

        // Genera conexiones aleatorias
        for (let i = 0; i < neurons.length; i++) {
            for (let j = i + 1; j < neurons.length; j++) {
                if (Math.random() > 0.85) {
                    connections.push({
                        from: neurons[i],
                        to: neurons[j],
                        active: false // Estado de la conexión
                    });
                }
            }
        }

        // Función para dibujar una neurona
        function drawNeuron(neuron) {
            ctx.beginPath();
            ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
            ctx.fillStyle = neuron.active ? "cyan" : "white";
            ctx.fill();
        }

        // Función para dibujar una conexión
        function drawConnection(connection) {
            const { from, to, active } = connection;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = active ? "rgba(0, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = active ? 2 : 1;
            ctx.stroke();
        }

        // Función para propagar un impulso
        function propagateImpulse(neuron) {
            neuron.active = true;
            neuron.activationTime = Date.now();

            // Activa las conexiones relacionadas
            connections.forEach(connection => {
                if (connection.from === neuron || connection.to === neuron) {
                    connection.active = true;
                    setTimeout(() => {
                        connection.active = false;
                    }, 200); // Duración del resaltado de la conexión
                }
            });

            // Propaga el impulso a las neuronas conectadas
            connections.forEach(connection => {
                if (connection.from === neuron && !connection.to.active) {
                    setTimeout(() => propagateImpulse(connection.to), 100); // Retardo entre neuronas
                } else if (connection.to === neuron && !connection.from.active) {
                    setTimeout(() => propagateImpulse(connection.from), 100);
                }
            });
        }

        // Animación principal
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibuja conexiones
            connections.forEach(connection => {
                drawConnection(connection);
            });

            // Dibuja neuronas
            neurons.forEach(neuron => {
                drawNeuron(neuron);

                // Mueve las neuronas
                neuron.x += neuron.vx;
                neuron.y += neuron.vy;

                // Rebota en los bordes del canvas
                if (neuron.x < 0 || neuron.x > canvas.width) neuron.vx *= -1;
                if (neuron.y < 0 || neuron.y > canvas.height) neuron.vy *= -1;

                // Desactiva la neurona después de un tiempo
                if (neuron.active && Date.now() - neuron.activationTime > 200) {
                    neuron.active = false;
                }
            });

            requestAnimationFrame(animate);
        }

        // Activa una neurona al azar cada cierto tiempo
        setInterval(() => {
            const randomNeuron = neurons[Math.floor(Math.random() * neurons.length)];
            propagateImpulse(randomNeuron);
        }, 1000);

        // Activa una neurona al hacer clic
        canvas.addEventListener("click", (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Encuentra la neurona más cercana al clic
            let closestNeuron = null;
            let closestDistance = Infinity;
            neurons.forEach(neuron => {
                const distance = Math.sqrt((neuron.x - mouseX) ** 2 + (neuron.y - mouseY) ** 2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNeuron = neuron;
                }
            });

            if (closestNeuron) {
                propagateImpulse(closestNeuron);
            }
        });

        animate();