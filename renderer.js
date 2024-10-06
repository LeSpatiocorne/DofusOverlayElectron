const { ipcRenderer, shell } = require('electron');
const path = require('path');

const apps = [
    { name: 'Dofensive', icon: 'FaviconDofensive.png', url: 'https://dofensive.com/fr' },
    { name: 'Dofus-Portal', icon: 'faviconDofPort.ico', url: 'https://dofus-portals.fr' },
    { name: 'DofusDB', icon: 'FaviconDB.png', url: 'https://dofusdb.fr/fr/tools/treasure-hunt' },
    { name: 'DofusPlanet', icon: 'FaviconDP.png', url: 'https://dofusplanet.fr/' },
    { name: 'DofusBook', icon: 'faviconDofBook.ico', url: 'https://dofusbook.net/' },
    { name: 'Dofus pour les noobs', icon: 'FaviconDPLN.ico', url: 'https://www.dofuspourlesnoobs.com/' },
    { name: 'Dofus-Metamob', icon: 'FaviconMetaMob.png', url: 'https://metamob.fr/' },
    { name: 'Hall-des-douzes', icon: 'FaviconHDD.png', url: 'https://www.halles-des-douze.fr/' },
];

let tabs, webviews;
let minButton;
let pinButton;

function initializeApp() {
    console.log('Initialisation de l\'application');
    const toolbar = document.getElementById('toolbar');
    tabs = document.getElementById('tabs');
    webviews = document.getElementById('webviews');

    if (!toolbar || !tabs || !webviews) {
        console.error('Éléments nécessaires non trouvés');
        return;
    }

    // Ajouter les boutons d'application existants
    apps.forEach(app => {
        const button = createAppButton(app);
        toolbar.appendChild(button);
    });

    // Ajouter le bouton de calculatrice
    const calcButton = createCalcButton();
    toolbar.appendChild(calcButton);

    attachToolbarListeners();

    // Ouvrir automatiquement la page Spatioverse au démarrage
    const spatioverse = apps.find(app => app.name === 'Spatioverse');
    if (spatioverse) {
        openWebView(spatioverse);
    }
}

function createAppButton(app) {
    const button = document.createElement('button');
    button.className = 'app-button';
    button.title = app.name;
    
    const icon = document.createElement('img');
    icon.src = path.join(__dirname, 'assets', 'websites', app.icon);
    icon.alt = app.name;
    icon.className = 'app-icon';
    
    button.appendChild(icon);
    button.onclick = () => openWebView(app);
    return button;
}

function createSpatioButton() {
    console.log('Création du bouton Spatioverse');
    const button = document.createElement('button');
    button.className = 'app-button spatio-button';
    button.title = 'Spatioverse';
    
    const icon = document.createElement('img');
    const iconPath = path.join(__dirname, 'assets', 'websites', 'spatioverse.png');
    console.log('Chemin de l\'icône Spatioverse:', iconPath);
    icon.src = iconPath;
    icon.alt = 'Spatioverse';
    icon.className = 'app-icon';
    
    button.appendChild(icon);
    button.onclick = () => {
        console.log('Clic sur le bouton Spatioverse');
        shell.openExternal('https://lespatioverse.xyz/');
    };
    return button;
}

function openWebView(app) {
    let tab = document.querySelector(`.tab[data-url="${app.url}"]`);
    let view = document.querySelector(`.webview[data-url="${app.url}"], iframe[data-url="${app.url}"]`);
    
    if (!tab) {
        tab = createTab(app);
        view = createWebView(app);
    } else {
        // Si le webview ou l'iframe existe déjà, assurez-vous qu'il est visible
        view.style.visibility = 'visible';
    }
    
    // Activer l'onglet et le webview/iframe
    document.querySelectorAll('.tab, .webview, iframe').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    view.classList.add('active');

    // Assurez-vous que le fond par défaut est masqué
    const defaultBackground = document.getElementById('default-background');
    if (defaultBackground) {
        defaultBackground.style.display = 'none';
    }
}

function createTab(app) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-url', app.url);
    tab.textContent = app.name;
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-tab';
    closeBtn.textContent = '×';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeWebView(app.url);
    };
    
    tab.appendChild(closeBtn);
    tab.onclick = () => openWebView(app);
    tabs.appendChild(tab);
    
    return tab;
}

function createWebView(app) {
    const webview = document.createElement('webview');
    webview.className = 'webview';
    webview.setAttribute('data-url', app.url);
    webview.src = app.url;
    webview.style.width = '100%';
    webview.style.height = '100%';
    webview.style.visibility = 'hidden'; // Cacher le webview initialement
    
    // Utiliser une session persistante unique pour chaque domaine
    const sessionPartition = `persist:${new URL(app.url).hostname}`;
    webview.setAttribute('partition', sessionPartition);
    
    // Activer les fonctionnalités supplémentaires
    webview.setAttribute('allowpopups', '');
    webview.setAttribute('webpreferences', 'nativeWindowOpen=yes, contextIsolation=no, nodeIntegration=no, enableRemoteModule=no');
    
    if (app.url.includes('dofusdb.fr')) {
        // Paramètres spécifiques pour DofusDB
        webview.setAttribute('webpreferences', 'nativeWindowOpen=yes, contextIsolation=no, nodeIntegration=no, enableRemoteModule=no, webSecurity=no');
        webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }
    
    webview.setAttribute('preload', './preload.js');
    
    webview.addEventListener('dom-ready', () => {
        if (app.url.includes('dofusdb.fr')) {
            webview.executeJavaScript(`
                // Forcer le déclenchement des événements de clic
                document.body.addEventListener('click', (event) => {
                    console.log('Clic détecté sur:', event.target);
                    const path = event.composedPath();
                    for (let i = 0; i < path.length; i++) {
                        if (path[i].click && typeof path[i].click === 'function') {
                            try {
                                path[i].click();
                                break;
                            } catch (error) {
                                console.error('Erreur lors du clic:', error);
                            }
                        }
                    }
                }, true);

                console.log('Script de débogage injecté pour DofusDB');
            `);
        }
        
        // Attendre un court instant pour s'assurer que le contenu est rendu
        setTimeout(() => {
            webview.style.visibility = 'visible';
            const defaultBackground = document.getElementById('default-background');
            if (defaultBackground) {
                defaultBackground.style.display = 'none';
            }
        }, 100);
    });
    
    // Gérer les erreurs de chargement
    webview.addEventListener('did-fail-load', (event) => {
        console.error('Erreur de chargement:', event);
        webview.src = 'error.html'; // Page d'erreur personnalisée
    });
    
    webviews.appendChild(webview);
    
    return webview;
}

function closeWebView(url) {
    const tab = document.querySelector(`.tab[data-url="${url}"]`);
    const view = document.querySelector(`.webview[data-url="${url}"], iframe[data-url="${url}"]`);
    
    if (tab && view) {
        tab.remove();
        view.remove();
    }

    // Si c'était le dernier onglet, afficher le fond par défaut
    if (document.querySelectorAll('.tab').length === 0) {
        document.getElementById('default-background').style.display = 'flex';
    } else {
        // Sinon, activer le dernier onglet
        const lastTab = document.querySelector('.tab:last-child');
        if (lastTab) {
            const lastApp = apps.find(app => app.url === lastTab.getAttribute('data-url'));
            if (lastApp) {
                openWebView(lastApp);
            }
        }
    }
}

function attachWindowControlListeners() {
    console.log('Attachement des écouteurs pour les contrôles de fenêtre');
    
    minButton = document.getElementById('min-button');
    const maxButton = document.getElementById('max-button');
    const closeButton = document.getElementById('close-button');

    if (minButton) {
        minButton.addEventListener('click', () => {
            ipcRenderer.send('toggle-window-state');
        });
    } else {
        console.error('Bouton minimiser non trouvé');
    }

    if (maxButton) {
        maxButton.addEventListener('click', () => {
            console.log('Bouton maximiser cliqué');
            ipcRenderer.send('maximize-window');
        });
    } else {
        console.error('Bouton maximiser non trouvé');
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            console.log('Bouton fermer cliqué');
            ipcRenderer.send('close-window');
        });
    } else {
        console.error('Bouton fermer non trouvé');
    }

    pinButton = document.getElementById('pin-button');
    pinIcon = document.getElementById('pin-icon');
    if (pinButton) {
        pinButton.addEventListener('click', () => {
            ipcRenderer.send('toggle-pin-window');
        });
    }

    // Demander l'état initial d'épinglage
    ipcRenderer.send('get-pin-status');
}

// Écouter les changements d'état d'épinglage
ipcRenderer.on('pin-status-changed', (event, isOnTop) => {
    const pinButton = document.getElementById('pin-button');
    if (pinButton) {
        pinButton.classList.toggle('active', isOnTop);
        pinButton.title = isOnTop ? 'Désépingler la fenêtre' : 'Épingler la fenêtre';
    }
});

// Recevoir l'état initial d'épinglage
ipcRenderer.on('pin-status', (event, isOnTop) => {
    const pinButton = document.getElementById('pin-button');
    if (pinButton) {
        pinButton.classList.toggle('active', isOnTop);
        pinButton.title = isOnTop ? 'Désépingler la fenêtre' : 'Épingler la fenêtre';
    }
});

function attachToolbarListeners() {
    // Ajoutez ceci pour gérer les clics sur les boutons des apps
    document.querySelectorAll('.app-button').forEach(button => {
        button.addEventListener('click', () => {
            const app = apps.find(a => a.name === button.title);
            if (app) {
                openWebView(app);
            }
        });
    });
}

function navigateToUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    const activeWebview = document.querySelector('.webview.active');
    if (activeWebview) {
        activeWebview.src = url;
    } else {
        openWebView({ name: 'New Tab', url: url });
    }
}

// Ajoutez cette fonction pour initialiser l'état par défaut
function initDefaultState() {
    if (document.querySelectorAll('.tab').length === 0) {
        document.getElementById('default-background').style.display = 'flex';
    } else {
        document.getElementById('default-background').style.display = 'none';
    }
}

function updateMinButtonState(isMinimized) {
    if (minButton) {
        minButton.title = isMinimized ? 'Restaurer' : 'Minimiser';
        // Vous pouvez également changer l'icône du bouton si vous le souhaitez
        // minButton.innerHTML = isMinimized ? '□' : '-';
    }
}

ipcRenderer.on('window-state-changed', (event, isMinimized) => {
    console.log(`État de la fenêtre changé : ${isMinimized ? 'minimisée' : 'restaurée'}`);
    updateMinButtonState(isMinimized);
});

// Appelez cette fonction après avoir initialisé l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachWindowControlListeners();

    // Ajouter un gestionnaire d'événements pour le lien @LeSpatiocorne
    const spatioCorneLink = document.getElementById('spatiocorne-link');
    if (spatioCorneLink) {
        spatioCorneLink.addEventListener('click', (event) => {
            event.preventDefault();
            shell.openExternal('https://lespatioverse.xyz/');
        });
    }
});

function createCalcButton() {
    const button = document.createElement('button');
    button.className = 'app-button';
    button.title = 'Calculatrice';
    
    const icon = document.createElement('img');
    icon.src = path.join(__dirname, 'assets', 'websites', 'calc-icon.png');
    icon.alt = 'Calculatrice';
    icon.className = 'app-icon';
    
    button.appendChild(icon);
    button.onclick = openCalculator;
    return button;
}

function openCalculator() {
    let calcTab = document.querySelector('.tab[data-url="calculator/calc.html"]');
    let calcView = document.querySelector('iframe[data-url="calculator/calc.html"]');
    
    if (!calcTab) {
        calcTab = createCalcTab();
        calcView = createCalcView();
    }
    
    document.querySelectorAll('.tab, .webview, iframe').forEach(el => el.classList.remove('active'));
    calcTab.classList.add('active');
    calcView.classList.add('active');

    const defaultBackground = document.getElementById('default-background');
    if (defaultBackground) {
        defaultBackground.style.display = 'none';
    }
}

function createCalcTab() {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-url', 'calculator/calc.html');
    tab.textContent = 'Calculatrice';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-tab';
    closeBtn.textContent = '×';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeCalcView();
    };
    
    tab.appendChild(closeBtn);
    tab.onclick = openCalculator;
    tabs.appendChild(tab);
    
    return tab;
}

function createCalcView() {
    const iframe = document.createElement('iframe');
    iframe.className = 'webview';
    iframe.setAttribute('data-url', 'calculator/calc.html');
    iframe.src = 'calculator/calc.html';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    
    webviews.appendChild(iframe);
    
    return iframe;
}

function closeCalcView() {
    const calcTab = document.querySelector('.tab[data-url="calculator/calc.html"]');
    const calcView = document.querySelector('iframe[data-url="calculator/calc.html"]');
    
    if (calcTab && calcView) {
        calcTab.remove();
        calcView.remove();
    }

    if (document.querySelectorAll('.tab').length === 0) {
        document.getElementById('default-background').style.display = 'flex';
    } else {
        const lastTab = document.querySelector('.tab:last-child');
        if (lastTab) {
            const lastAppUrl = lastTab.getAttribute('data-url');
            const lastApp = apps.find(app => app.url === lastAppUrl);
            if (lastApp) {
                openWebView(lastApp);
            } else if (lastAppUrl === 'calculator/calc.html') {
                openCalculator();
            }
        }
    }
}