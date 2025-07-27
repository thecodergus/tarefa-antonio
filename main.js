// ==UserScript==
// @name         Download de mãos
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Botão persistente para extração de mãos no CheckReplay
// @author       Você
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

            return this.extrairContainersCartas(handsListDiv);
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