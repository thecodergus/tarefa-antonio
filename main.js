// ==UserScript==
// @name         Download de mãos
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Botão que SEMPRE aparece no CheckReplay
// @author       Você
// @match        https://*.checkreplay.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let botaoId = 'botao-checkreplay-' + Date.now();
    let tentativas = 0;
    const maxTentativas = 10;

    // Função principal para capturar a div hands-list
    function capturarHandsList() {
        const handsListDiv = document.getElementById('hands-list');
        
        if (!handsListDiv) {
            console.warn('Div com ID "hands-list" não encontrada!');
            return null;
        }
        
        console.log('Div hands-list encontrada:', handsListDiv);
        return handsListDiv;
    }
    
    // Função que será executada no clique
    function minhaFuncao() {
        console.log(capturarHandsList())
    }
    
    // Função para remover botão existente
    function removerBotaoExistente() {
        const botaoExistente = document.getElementById(botaoId);
        if (botaoExistente) {
            botaoExistente.remove();
        }
    }
    
    // Criar o botão com CSS super agressivo
    function criarBotao() {
        tentativas++;
        console.log(`🔄 Tentativa ${tentativas} de criar botão...`);
        
        // Remover botão existente se houver
        removerBotaoExistente();
        
        const botao = document.createElement('button');
        botao.textContent = 'Clique aqui';
        botao.id = botaoId;
        
        // CSS SUPER AGRESSIVO que sobrescreve tudo
        botao.setAttribute('style', `
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
        `);
        
        // Efeitos hover e click
        botao.addEventListener('mouseenter', function() {
            this.style.setProperty('background', '#0056b3', 'important');
            this.style.setProperty('transform', 'scale(1.05)', 'important');
        });
        
        botao.addEventListener('mouseleave', function() {
            this.style.setProperty('background', '#007bff', 'important');
            this.style.setProperty('transform', 'scale(1)', 'important');
        });
        
        botao.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            // Feedback visual
            this.style.setProperty('background', '#28a745', 'important');
            this.textContent = '✓ Executado!';
            
            minhaFuncao();
            
            setTimeout(() => {
                this.style.setProperty('background', '#007bff', 'important');
                this.textContent = 'Clique aqui';
            }, 1000);
        });
        
        // Tentar diferentes métodos de inserção
        function inserirBotao() {
            try {
                // Método 1: Adicionar ao body
                if (document.body) {
                    document.body.appendChild(botao);
                    console.log('✅ Botão adicionado ao body');
                    return true;
                }
                
                // Método 2: Adicionar ao documentElement
                if (document.documentElement) {
                    document.documentElement.appendChild(botao);
                    console.log('✅ Botão adicionado ao documentElement');
                    return true;
                }
                
                // Método 3: Adicionar ao primeiro elemento encontrado
                const primeiroElemento = document.querySelector('*');
                if (primeiroElemento) {
                    primeiroElemento.parentNode.appendChild(botao);
                    console.log('✅ Botão adicionado ao primeiro elemento');
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error('❌ Erro ao inserir botão:', error);
                return false;
            }
        }
        
        // Inserir o botão
        if (inserirBotao()) {
            // Verificar se o botão está visível após 500ms
            setTimeout(() => {
                const botaoVerificacao = document.getElementById(botaoId);
                if (botaoVerificacao) {
                    const rect = botaoVerificacao.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        console.log('✅ Botão está visível e funcionando!');
                    } else {
                        console.log('⚠️ Botão existe mas pode estar oculto, forçando visibilidade...');
                        forcarVisibilidade();
                    }
                } else {
                    console.log('❌ Botão foi removido, recriando...');
                    if (tentativas < maxTentativas) {
                        setTimeout(criarBotao, 1000);
                    }
                }
            }, 500);
        } else {
            console.log('❌ Falha ao inserir botão, tentando novamente...');
            if (tentativas < maxTentativas) {
                setTimeout(criarBotao, 1000);
            }
        }
    }
    
    // Função para forçar visibilidade
    function forcarVisibilidade() {
        const botao = document.getElementById(botaoId);
        if (botao) {
            // Reforçar todos os estilos críticos
            const estilosForcados = {
                'position': 'fixed',
                'top': '20px',
                'right': '20px',
                'z-index': '2147483647',
                'display': 'block',
                'visibility': 'visible',
                'opacity': '1',
                'pointer-events': 'auto'
            };
            
            Object.entries(estilosForcados).forEach(([prop, value]) => {
                botao.style.setProperty(prop, value, 'important');
            });
            
            console.log('🔧 Visibilidade forçada aplicada');
        }
    }
    
    // Observer para detectar se o botão foi removido
    function criarObserver() {
        const observer = new MutationObserver((mutations) => {
            const botaoExiste = document.getElementById(botaoId);
            if (!botaoExiste && tentativas < maxTentativas) {
                console.log('🔄 Botão foi removido, recriando...');
                setTimeout(criarBotao, 500);
            }
        });
        
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
        
        console.log('👀 Observer ativado para monitorar o botão');
    }
    
    // Função principal de inicialização
    function inicializar() {
        console.log('🚀 Inicializando script CheckReplay...');
        console.log('📍 URL:', window.location.href);
        
        // Aguardar um pouco mais para garantir que a página carregou
        setTimeout(() => {
            criarBotao();
            
            // Ativar observer após criar o botão
            setTimeout(() => {
                if (document.body || document.documentElement) {
                    criarObserver();
                }
            }, 1000);
            
            // Verificação adicional após 3 segundos
            setTimeout(() => {
                const botao = document.getElementById(botaoId);
                if (!botao && tentativas < maxTentativas) {
                    console.log('🔄 Verificação final: recriando botão...');
                    criarBotao();
                }
            }, 3000);
            
        }, 1000);
    }
    
    // Aguardar carregamento da página com múltiplas estratégias
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
        window.addEventListener('load', inicializar);
    } else {
        inicializar();
    }
    
    // Backup: tentar novamente após 5 segundos
    setTimeout(inicializar, 5000);
    
})();