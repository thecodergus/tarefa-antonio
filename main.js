// ==UserScript==
// @name         Download de mãos
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Botão persistente para extração de mãos no CheckReplay
// @author       Gustavo Michels de Camargo
// @match        https://*.checkreplay.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Configurações e constantes do sistema
     */
    const CONFIG = {
        MAX_TENTATIVAS: 10,
        INTERVALO_TENTATIVA: 1000,
        INTERVALO_VERIFICACAO: 500,
        TIMEOUT_INICIALIZACAO: 1000,
        TIMEOUT_BACKUP: 5000
    };

    /**
     * Estilos CSS para o botão
     */
    const ESTILOS_BOTAO = {
        base: `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 2147483647 !important;
            padding: 12px 24px !important;
            background: #007bff !important;
            color: white !important;
            border: 2px solid #0056b3 !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: bold !important;
            font-family: Arial, sans-serif !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            height: auto !important;
            margin: 0 !important;
            transform: none !important;
            transition: all 0.2s ease !important;
            text-decoration: none !important;
            text-align: center !important;
            line-height: normal !important;
            min-width: 120px !important;
            min-height: 40px !important;
            box-sizing: border-box !important;
            pointer-events: auto !important;
            user-select: none !important;
        `,
        hover: '#0056b3',
        click: '#28a745',
        normal: '#007bff'
    };
    /**
     * Extrai informações das cartas de um container retornado por extrairContainersCartas
     * @param {Object} item - Item contendo html e dados do container
     * @returns {Array} Tupla com as duas cartas no formato ["valor#naipe", "valor#naipe"]
     */
    function extrairCartasDoContainer(item) {
        // Mapeamento de cores hexadecimais para naipes
        const MAPA_CORES_NAIPES = {
            '#434343': 'Espadas',   // Cinza
            '#D4131A': 'Copas',     // Vermelho
            '#2371C8': 'Ouros',     // Azul
            '#0F712A': 'Paus'       // Verde
        };
        
        try {
            const resultado = [];
            
            // Usar split para dividir o HTML em partes onde aparecem os spans
            const partes = item.html.split('<span');
            
            // Ignorar a primeira parte (antes do primeiro span)
            for (let i = 1; i < partes.length; i++) {
                const parte = partes[i];
                
                // Encontrar a cor - procurar por bg-[ seguido da cor
                const inicioCorIndex = parte.indexOf('bg-[');
                if (inicioCorIndex === -1) continue;
                
                // Extrair a cor (começa após 'bg-[' e termina em ']')
                const inicioCol = inicioCorIndex + 4; // pular 'bg-['
                const fimCol = parte.indexOf(']', inicioCol);
                if (fimCol === -1) continue;
                
                const cor = parte.substring(inicioCol, fimCol);
                
                // Encontrar o valor da carta (conteúdo entre > e <)
                const inicioValorIndex = parte.indexOf('>');
                if (inicioValorIndex === -1) continue;
                
                const fimValorIndex = parte.indexOf('<', inicioValorIndex);
                if (fimValorIndex === -1) continue;
                
                const valor = parte.substring(inicioValorIndex + 1, fimValorIndex).trim();
                
                // Mapear cor para naipe
                const naipe = MAPA_CORES_NAIPES[cor];
                if (!naipe) {
                    console.warn(`Cor desconhecida: ${cor}`);
                    continue;
                }
                
                resultado.push(`${valor}#${naipe}`);
            }
            
            // Verificar se encontramos exatamente 2 cartas
            if (resultado.length !== 2) {
                console.warn(`Esperado 2 cartas, encontrado ${resultado.length}`);
                return null;
            }
            
            return resultado;
            
        } catch (error) {
            console.error('Erro ao processar container de cartas:', error);
            return null;
        }
    }

    /**
     * Salva os dados em um arquivo de texto formatado e força o download
     * @param {Array} dados - Array retornado pela função extrairDadosMaos
     * @param {string} nomeArquivo - Nome do arquivo (opcional)
     */
    function salvarComoTexto(dados, nomeArquivo = null) {
        try {
            // Validar dados de entrada
            if (!dados || !Array.isArray(dados) || dados.length === 0) {
                console.warn('⚠️ Nenhum dado válido para salvar');
                alert('Nenhum dado encontrado para salvar!');
                return false;
            }
            // Gerar nome do arquivo se não fornecido
            if (!nomeArquivo) {
                const agora = new Date();
                const timestamp = agora.toISOString()
                    .replace(/[:.]/g, '-')
                    .replace('T', '_')
                    .substring(0, 19); // Remove milissegundos e timezone
                nomeArquivo = `maos-poker-${timestamp}.txt`;
            }
            // Garantir extensão .txt
            if (!nomeArquivo.endsWith('.txt')) {
                nomeArquivo += '.txt';
            }
            // Função para obter timestamp completo legível
            const obterTimestampLegivel = () => {
                const agora = new Date();
                return agora.toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            };
            // Criar conteúdo formatado
            const linhas = [];
            
            // Cabeçalho do arquivo
            linhas.push('='.repeat(60));
            linhas.push('           EXTRAÇÃO DE MÃOS DE POKER');
            linhas.push('='.repeat(60));
            linhas.push('');
            linhas.push(`Data da extração: ${obterTimestampLegivel()}`);
            linhas.push(`Total de mãos extraídas: ${dados.length}`);
            linhas.push(`Arquivo gerado: ${nomeArquivo}`);
            linhas.push('');
            linhas.push('-'.repeat(60));
            linhas.push('');
            // Processar cada mão
            dados.forEach((item, index) => {
                try {
                    const cartas = item;
                    
                    linhas.push(`MÃO ${index + 1}:`);
                    
                    if (cartas && cartas.length === 2) {
                        linhas.push(`├─ Primeira carta: ${formatarCartaCompleta(cartas[0])}`);
                        linhas.push(`└─ Segunda carta: ${formatarCartaCompleta(cartas[1])}`);
                    } else {
                        linhas.push(`└─ ❌ Erro na extração das cartas`);
                    }
                    
                    linhas.push(''); // Linha em branco entre mãos
                    
                } catch (error) {
                    linhas.push(`MÃO ${index + 1}: ❌ ERRO - ${error.message}`);
                    linhas.push('');
                }
            });
            // Rodapé
            linhas.push('-'.repeat(60));
            linhas.push('');
            linhas.push('Legenda dos naipes:');
            linhas.push('  • Espadas (♠) - Cor cinza (#434343)');
            linhas.push('  • Copas (♥) - Cor vermelha (#D4131A)');
            linhas.push('  • Ouros (♦) - Cor azul (#2371C8)');
            linhas.push('  • Paus (♣) - Cor verde (#0F712A)');
            linhas.push('');
            linhas.push('='.repeat(60));
            linhas.push(`Fim do arquivo - ${dados.length} mãos processadas`);
            linhas.push('='.repeat(60));
            // Juntar todas as linhas
            const conteudoTexto = linhas.join('\n');
            // Criar blob com BOM para UTF-8 (melhora compatibilidade)
            const BOM = '\uFEFF'; // Byte Order Mark para UTF-8
            const blob = new Blob([BOM + conteudoTexto], { 
                type: 'text/plain;charset=utf-8;' 
            });
            // Criar URL para o blob
            const url = URL.createObjectURL(blob);
            
            // Criar elemento de link temporário
            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            link.style.display = 'none'; // Garantir que não apareça na tela
            
            // Adicionar ao DOM temporariamente
            document.body.appendChild(link);
            
            // Simular clique para iniciar download
            link.click();
            
            // Limpar: remover do DOM e revogar URL
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Log de sucesso
            console.log(`✅ Arquivo de texto salvo com sucesso: ${nomeArquivo}`);
            console.log(`📊 ${dados.length} mãos exportadas`);
            
            // Mostrar mensagem de sucesso para o usuário
            setTimeout(() => {
                alert(`✅ Download iniciado!\n\nArquivo: ${nomeArquivo}\nMãos exportadas: ${dados.length}`);
            }, 200);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar arquivo de texto:', error);
            alert(`❌ Erro ao salvar arquivo: ${error.message}`);
            return false;
        }
    }

    /**
     * Converte string de carta do formato "valor#naipe" para formato legível
     * @param {string} cartaString - String no formato "J#Espadas"
     * @returns {string} String formatada como "J de Espadas ♠"
     */
    function formatarCarta(cartaString) {
        try {
            // Validar entrada
            if (!cartaString || typeof cartaString !== 'string') {
                return 'Carta inválida';
            }

            // Separar valor e naipe
            const partes = cartaString.split('#');
            if (partes.length !== 2) {
                return 'Formato inválido';
            }

            const [valor, naipe] = partes;

            // Mapeamento de naipes para símbolos
            const SIMBOLOS_NAIPES = {
                'Espadas': '♠',
                'Copas': '♥',
                'Ouros': '♦',
                'Paus': '♣'
            };

            // Mapeamento de valores especiais para nomes completos
            const VALORES_ESPECIAIS = {
                'A': 'Ás',
                'K': 'Rei',
                'Q': 'Dama',
                'J': 'Valete',
                'T': '10'
            };

            // Obter símbolo do naipe
            const simbolo = SIMBOLOS_NAIPES[naipe];
            if (!simbolo) {
                return `${valor} de ${naipe} (naipe desconhecido)`;
            }

            // Obter nome do valor (se for especial) ou manter o número
            const valorFormatado = VALORES_ESPECIAIS[valor] || valor;

            // Retornar string formatada
            return `${valorFormatado} de ${naipe} ${simbolo}`;

        } catch (error) {
            console.error('Erro ao formatar carta:', error);
            return 'Erro na formatação';
        }
    }

    /**
     * Formata múltiplas cartas de uma vez
     * @param {Array} cartas - Array de strings no formato ["J#Espadas", "3#Ouros"]
     * @returns {Array} Array de strings formatadas
     */
    function formatarCartas(cartas) {
        if (!Array.isArray(cartas)) {
            return [];
        }

        return cartas.map(carta => formatarCarta(carta));
    }

    /**
     * Formata uma mão completa (duas cartas) em uma string única
     * @param {Array} cartas - Array com duas cartas ["J#Espadas", "3#Ouros"]
     * @returns {string} String formatada da mão completa
     */
    function formatarMao(cartas) {
        if (!Array.isArray(cartas) || cartas.length !== 2) {
            return 'Mão inválida';
        }

        const carta1 = formatarCarta(cartas[0]);
        const carta2 = formatarCarta(cartas[1]);

        return `${carta1} | ${carta2}`;
    }

    /**
     * Versão alternativa com formato mais compacto
     * @param {string} cartaString - String no formato "J#Espadas"
     * @returns {string} String formatada de forma compacta
     */
    function formatarCartaCompacta(cartaString) {
        try {
            if (!cartaString || typeof cartaString !== 'string') {
                return 'Inválida';
            }

            const [valor, naipe] = cartaString.split('#');
            
            const SIMBOLOS_NAIPES = {
                'Espadas': '♠',
                'Copas': '♥',
                'Ouros': '♦',
                'Paus': '♣'
            };

            const VALORES_COMPACTOS = {
                'A': 'A',
                'K': 'K',
                'Q': 'Q', 
                'J': 'J',
                'T': '10'
            };

            const simbolo = SIMBOLOS_NAIPES[naipe] || '?';
            const valorComp = VALORES_COMPACTOS[valor] || valor;

            return `${valorComp}${simbolo}`;

        } catch (error) {
            return 'Erro';
        }
    }

    /**
     * Versão com descrição completa em português
     * @param {string} cartaString - String no formato "J#Espadas"
     * @returns {string} String com descrição completa
     */
    function formatarCartaCompleta(cartaString) {
        try {
            if (!cartaString || typeof cartaString !== 'string') {
                return 'Carta inválida';
            }

            const [valor, naipe] = cartaString.split('#');
            
            const SIMBOLOS_NAIPES = {
                'Espadas': '♠',
                'Copas': '♥',
                'Ouros': '♦',
                'Paus': '♣'
            };

            const DESCRICOES_COMPLETAS = {
                'A': 'Ás',
                'K': 'Rei',
                'Q': 'Dama',
                'J': 'Valete',
                'T': 'Dez',
                '2': 'Dois',
                '3': 'Três',
                '4': 'Quatro',
                '5': 'Cinco',
                '6': 'Seis',
                '7': 'Sete',
                '8': 'Oito',
                '9': 'Nove'
            };

            const simbolo = SIMBOLOS_NAIPES[naipe];
            const descricao = DESCRICOES_COMPLETAS[valor] || valor;
            
            if (!simbolo) {
                return `${descricao} de ${naipe}`;
            }

            return `${descricao} de ${naipe} ${simbolo}`;

        } catch (error) {
            return 'Erro na formatação';
        }
    }

    /**
     * Função utilitária para diferentes estilos de formatação
     * @param {string} cartaString - String no formato "J#Espadas"
     * @param {string} estilo - 'simples', 'compacta', 'completa'
     * @returns {string} String formatada conforme o estilo
     */
    function formatarCartaEstilo(cartaString, estilo = 'simples') {
        switch (estilo.toLowerCase()) {
            case 'compacta':
                return formatarCartaCompacta(cartaString);
            case 'completa':
                return formatarCartaCompleta(cartaString);
            case 'simples':
            default:
                return formatarCarta(cartaString);
        }
    }
    /**
     * Classe principal para gerenciar o botão do CheckReplay
     */
    class CheckReplayButton {
        constructor() {
            this.botaoId = `botao-checkreplay-${Date.now()}`;
            this.tentativas = 0;
            this.observer = null;
            this.botaoElement = null;
        }

        /**
         * Inicializa o sistema do botão
         */
        async inicializar() {
            console.log('🚀 Inicializando CheckReplay Button...');
            console.log('📍 URL:', window.location.href);

            try {
                await this.aguardarCarregamentoPagina();
                await this.criarBotaoComTentativas();
                this.iniciarMonitoramento();
                this.configurarVerificacaoAdicional();
            } catch (error) {
                console.error('❌ Erro na inicialização:', error);
            }
        }

        /**
         * Aguarda o carregamento completo da página
         */
        aguardarCarregamentoPagina() {
            return new Promise(resolve => {
                if (document.readyState === 'complete') {
                    setTimeout(resolve, CONFIG.TIMEOUT_INICIALIZACAO);
                } else {
                    window.addEventListener('load', () => {
                        setTimeout(resolve, CONFIG.TIMEOUT_INICIALIZACAO);
                    });
                }
            });
        }

        /**
         * Tenta criar o botão com sistema de tentativas
         */
        async criarBotaoComTentativas() {
            while (this.tentativas < CONFIG.MAX_TENTATIVAS) {
                try {
                    if (await this.criarBotao()) {
                        console.log('✅ Botão criado com sucesso!');
                        return true;
                    }
                } catch (error) {
                    console.error(`❌ Erro na tentativa ${this.tentativas + 1}:`, error);
                }
                
                this.tentativas++;
                if (this.tentativas < CONFIG.MAX_TENTATIVAS) {
                    await this.aguardar(CONFIG.INTERVALO_TENTATIVA);
                }
            }
            
            console.warn('⚠️ Máximo de tentativas atingido');
            return false;
        }

        /**
         * Cria e configura o botão
         */
        async criarBotao() {
            console.log(`🔄 Tentativa ${this.tentativas + 1} de criar botão...`);

            this.removerBotaoExistente();
            this.botaoElement = this.construirElementoBotao();
            
            if (this.inserirBotaoNoDom()) {
                await this.verificarVisibilidade();
                return true;
            }
            
            return false;
        }

        /**
         * Constrói o elemento do botão com todos os eventos
         */
        construirElementoBotao() {
            const botao = document.createElement('button');
            
            botao.textContent = 'Extrair Mãos';
            botao.id = this.botaoId;
            botao.setAttribute('style', ESTILOS_BOTAO.base);

            this.adicionarEventosBotao(botao);
            
            return botao;
        }

        /**
         * Adiciona todos os eventos ao botão
         */
        adicionarEventosBotao(botao) {
            botao.addEventListener('mouseenter', () => {
                botao.style.setProperty('background', ESTILOS_BOTAO.hover, 'important');
                botao.style.setProperty('transform', 'scale(1.05)', 'important');
            });

            botao.addEventListener('mouseleave', () => {
                botao.style.setProperty('background', ESTILOS_BOTAO.normal, 'important');
                botao.style.setProperty('transform', 'scale(1)', 'important');
            });

            botao.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.executarExtracao(botao);
            });
        }

        /**
         * Executa a extração de dados das mãos
         */
        async executarExtracao(botao) {
            // Feedback visual
            botao.style.setProperty('background', ESTILOS_BOTAO.click, 'important');
            botao.textContent = '✓ Executando...';

            try {
                const dados = this.extrairDadosMaos();
                console.log('📊 Dados extraídos:', dados);

                salvarComoTexto(dados, `mão-${new Date().toISOString()}.txt`)
                
                // Aqui você pode processar os dados como necessário
                this.processarDadosExtraidos(dados);
                
            } catch (error) {
                console.error('❌ Erro na extração:', error);
                botao.textContent = '❌ Erro!';
            }

            // Restaurar estado original
            setTimeout(() => {
                botao.style.setProperty('background', ESTILOS_BOTAO.normal, 'important');
                botao.textContent = 'Extrair Mãos';
            }, 1500);
        }

        /**
         * Extrai dados das mãos da página
         */
        extrairDadosMaos() {
            const handsListDiv = this.localizarElementoHandsList();
            
            if (!handsListDiv) {
                throw new Error('Elemento hands-list não encontrado');
            }

            return this.extrairContainersCartas(handsListDiv).map(extrairCartasDoContainer);
        }

        

        /**
         * Localiza o elemento principal com a lista de mãos
         */
        localizarElementoHandsList() {
            const elemento = document.getElementById('hands-list');
            
            if (!elemento) {
                console.warn('⚠️ Div com ID "hands-list" não encontrada!');
                return null;
            }

            return elemento;
        }

        /**
         * Extrai containers de cartas do HTML fornecido
         */
        extrairContainersCartas(elemento) {
            if (!elemento) return [];

            try {
                const containers = elemento.querySelectorAll('div#cards-container');
                return Array.from(containers).map(container => ({
                    html: container.outerHTML,
                    dados: this.extrairDadosContainer(container)
                }));
            } catch (error) {
                console.error('❌ Erro ao extrair containers:', error);
                return [];
            }
        }

        /**
         * Extrai dados específicos de um container
         */
        extrairDadosContainer(container) {
            // Implementar extração específica conforme necessário
            return {
                timestamp: new Date().toISOString(),
                conteudo: container.textContent.trim()
            };
        }

        /**
         * Processa os dados extraídos (implementar conforme necessidade)
         */
        processarDadosExtraidos(dados) {
            console.log(`📈 Processando ${dados.length} itens extraídos`);
            // Implementar processamento específico aqui
        }

        /**
         * Remove botão existente se houver
         */
        removerBotaoExistente() {
            const botaoExistente = document.getElementById(this.botaoId);
            if (botaoExistente) {
                botaoExistente.remove();
            }
        }

        /**
         * Insere o botão no DOM usando múltiplas estratégias
         */
        inserirBotaoNoDom() {
            const estrategias = [
                () => document.body?.appendChild(this.botaoElement),
                () => document.documentElement?.appendChild(this.botaoElement),
                () => {
                    const primeiro = document.querySelector('*');
                    return primeiro?.parentNode?.appendChild(this.botaoElement);
                }
            ];

            for (const [index, estrategia] of estrategias.entries()) {
                try {
                    estrategia();
                    console.log(`✅ Botão inserido usando estratégia ${index + 1}`);
                    return true;
                } catch (error) {
                    console.warn(`⚠️ Estratégia ${index + 1} falhou:`, error);
                }
            }

            console.error('❌ Todas as estratégias de inserção falharam');
            return false;
        }

        /**
         * Verifica se o botão está visível após inserção
         */
        async verificarVisibilidade() {
            await this.aguardar(CONFIG.INTERVALO_VERIFICACAO);
            
            const botao = document.getElementById(this.botaoId);
            if (!botao) {
                throw new Error('Botão não encontrado após inserção');
            }

            const rect = botao.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.log('⚠️ Botão oculto, forçando visibilidade...');
                this.forcarVisibilidade(botao);
            }
        }

        /**
         * Força a visibilidade do botão
         */
        forcarVisibilidade(botao) {
            const propriedadesCriticas = {
                'position': 'fixed',
                'top': '20px',
                'right': '20px',
                'z-index': '2147483647',
                'display': 'block',
                'visibility': 'visible',
                'opacity': '1',
                'pointer-events': 'auto'
            };

            Object.entries(propriedadesCriticas).forEach(([prop, valor]) => {
                botao.style.setProperty(prop, valor, 'important');
            });

            console.log('🔧 Visibilidade forçada aplicada');
        }

        /**
         * Inicia monitoramento do DOM para detectar remoção do botão
         */
        iniciarMonitoramento() {
            if (!document.body && !document.documentElement) return;

            this.observer = new MutationObserver(() => {
                const botaoExiste = document.getElementById(this.botaoId);
                if (!botaoExiste && this.tentativas < CONFIG.MAX_TENTATIVAS) {
                    console.log('🔄 Botão removido, recriando...');
                    setTimeout(() => this.criarBotaoComTentativas(), CONFIG.INTERVALO_VERIFICACAO);
                }
            });

            this.observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
            });

            console.log('👀 Monitoramento DOM ativado');
        }

        /**
         * Configura verificação adicional como backup
         */
        configurarVerificacaoAdicional() {
            setTimeout(() => {
                const botao = document.getElementById(this.botaoId);
                if (!botao && this.tentativas < CONFIG.MAX_TENTATIVAS) {
                    console.log('🔄 Verificação de backup: recriando botão...');
                    this.criarBotaoComTentativas();
                }
            }, 3000);
        }

        /**
         * Utilitário para aguardar um tempo específico
         */
        aguardar(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Limpa recursos e observadores
         */
        destruir() {
            if (this.observer) {
                this.observer.disconnect();
            }
            this.removerBotaoExistente();
        }
    }


    /**
     * Inicialização do sistema
     */
    function inicializarSistema() {
        const checkReplayButton = new CheckReplayButton();
        
        // Inicializar quando a página estiver pronta
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => checkReplayButton.inicializar());
            window.addEventListener('load', () => checkReplayButton.inicializar());
        } else {
            checkReplayButton.inicializar();
        }

        // Backup de inicialização
        setTimeout(() => checkReplayButton.inicializar(), CONFIG.TIMEOUT_BACKUP);

        // Disponibilizar globalmente para debugging
        window.checkReplayButton = checkReplayButton;
    }

    // Iniciar o sistema
    inicializarSistema();

})();