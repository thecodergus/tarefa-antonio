/**
 * Processa o container de uma mão, extraindo o valor e o naipe de cada carta.
 *
 * @param {string} containerHTML - O HTML do container da carta, retornado pela função extrairContainersCartas.
 * @returns {Array<string>} Uma tupla (array) com as cartas formatadas, ex: ["A#Copas", "Q#Espadas"].
 */
function processarHandContainer(containerHTML) {
    // Mapa de cores para naipes, facilitando a manutenção e clareza.
    const NAIPES_POR_COR = {
        '#434343': 'Espadas', // Cinza
        '#d4131a': 'Copas',   // Vermelho
        '#2371c8': 'Ouros',   // Azul
        '#0f712a': 'Paus'     // Verde
    };

    // Cria um elemento DOM temporário para analisar o HTML sem afetar a página.
    const parser = new DOMParser();
    const doc = parser.parseFromString(containerHTML, 'text/html');
    const spans = doc.querySelectorAll('span');

    if (!spans || spans.length === 0) {
        console.warn('Nenhuma tag <span> encontrada no HTML fornecido:', containerHTML);
        return [];
    }

    const cartasProcessadas = Array.from(spans).map(span => {
        const valor = span.textContent.trim();
        let naipe = 'Desconhecido'; // Valor padrão

        // Itera sobre as classes do span para encontrar a cor de fundo.
        for (const cls of span.classList) {
            if (cls.startsWith('bg-[')) {
                // Extrai o código hexadecimal da classe, ex: de 'bg-[#D4131A]' para '#d4131a'
                const cor = cls.substring(4, cls.length - 1).toLowerCase();
                
                if (NAIPES_POR_COR[cor]) {
                    naipe = NAIPES_POR_COR[cor];
                    break; // Encontrou a cor, pode parar de procurar
                }
            }
        }
        
        return `${valor}#${naipe}`;
    });

    return cartasProcessadas;
}

// --- Exemplos de Uso ---

// Exemplo 1
const entrada1 = `<div id="cards-container" class="flex items-center gap-1 w-fit"><span class="text-white text-sm bg-[#434343] w-[25px] h-[45px] flex items-center justify-center rounded-[2px] border border-white/70 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-200" style="opacity: 1; transform: none;">J</span><span class="text-white text-sm bg-[#D4131A] w-[25px] h-[45px] flex items-center justify-center rounded-[2px] border border-white/70 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-200" style="opacity: 1; transform: none;">3</span></div>`;
const saida1 = processarHandContainer(entrada1);
console.log('Entrada 1:', entrada1);
console.log('Saída 1:', saida1); // Saída esperada: ["J#Espadas", "3#Copas"]

// Exemplo 2
const entrada2 = `<div id="cards-container" class="flex items-center gap-1 w-fit"><span class="text-white text-sm bg-[#0F712A] w-[25px] h-[45px] flex items-center justify-center rounded-[2px] border border-white/70 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-200" style="opacity: 1; transform: none;">T</span><span class="text-white text-sm bg-[#0F712A] w-[25px] h-[45px] flex items-center justify-center rounded-[2px] border border-white/70 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-200" style="opacity: 1; transform: none;">7</span></div>`;
const saida2 = processarHandContainer(entrada2);
console.log('Entrada 2:', entrada2);
console.log('Saída 2:', saida2); // Saída esperada: ["T#Paus", "7#Paus"]

// Exemplo 3
const entrada3 = `<div id="cards-container" class="flex items-center gap-1 w-fit"><span class="text-white text-sm bg-[#D4131A] w-[25px] h-[45px] flex items-center justify-center rounded-[2px] border border-white/70 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-200" style="opacity: 1; transform: none;">K</span><span class="text-white text-sm bg-[#2371C8] w-[25px] h-[45px] flex items-center justify-center rounded-[2px] border border-white/70 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-200" style="opacity: 1; transform: none;">T</span></div>`;
const saida3 = processarHandContainer(entrada3);
console.log('Entrada 3:', entrada3);
console.log('Saída 3:', saida3); // Saída esperada: ["K#Copas", "T#Ouros"]