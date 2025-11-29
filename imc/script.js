function calcularIMC() {
    const altura = parseFloat(document.getElementById('altura').value) / 100;
    const peso = parseFloat(document.getElementById('peso').value);

    if (!altura || !peso) {
        document.getElementById('resultado').textContent = 'Introduce valores válidos.';
        return;
    }

    const imc = (peso / (altura * altura)).toFixed(2);
    document.getElementById('resultado').textContent = `Tu IMC es ${imc}`;
}
