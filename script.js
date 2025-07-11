document.addEventListener('DOMContentLoaded', function() {
    const popupOverlay = document.querySelector('.popup-overlay');
    const popup = document.querySelector('.popup');
    const closePopupButton = document.querySelector('.close-popup');
    const cellCoordinatesSpan = document.querySelector('.cell-coordinates');
    const popupCoordinatesSpan = document.querySelector('.popup-coordinates');
    const popupSubGrid = document.querySelector('.popup .sub-grid');
    const grid = document.querySelector('.grid');
    const xCoordinates = document.querySelector('.x-coordinates');
    const yCoordinates = document.querySelector('.y-coordinates');
    const legendItems = document.querySelectorAll('.legend .legend-item');
    const popupLegendItems = document.querySelectorAll('.popup-legend .legend-item');
    let selectedCell = null;
    let selectedTool = null;
    let lastPopupCell = null;

    // Init grid
    const letters = ['I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
    const numbers =  ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    function initializeGrid() {
        // Maak eerst de grid en coördinaatlabels leeg zodat dubbele of oude cellen niet blijven staan
        grid.innerHTML = '';
        xCoordinates.innerHTML = '';
        yCoordinates.innerHTML = '';
        let yCoordinatesRightEl = document.querySelector('.y-coordinates.right');
        if (yCoordinatesRightEl) yCoordinatesRightEl.innerHTML = '';
        let xCoordinatesBottomEl = document.querySelector('.x-coordinates.bottom');
        if (xCoordinatesBottomEl) xCoordinatesBottomEl.innerHTML = '';

        numbers.forEach(num => {
            const label = document.createElement('div');
            label.className = 'coordinate-label';
            label.textContent = num;
            xCoordinates.appendChild(label);
        });
        letters.forEach(letter => {
            const label = document.createElement('div');
            label.className = 'coordinate-label';
            label.textContent = letter;
            yCoordinates.appendChild(label);
        });
        letters.forEach((letter) => {
            numbers.forEach((num) => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.coordinates = `${letter}${num}`;
                cell.addEventListener('click', () => handleCellClick(cell));
                grid.appendChild(cell);
            });
        });
        if (yCoordinatesRightEl) {
            letters.forEach(letter => {
                const label = document.createElement('div');
                label.className = 'coordinate-label';
                label.textContent = letter;
                yCoordinatesRightEl.appendChild(label);
            });
        }
        if (xCoordinatesBottomEl) {
            numbers.forEach(num => {
                const label = document.createElement('div');
                label.className = 'coordinate-label';
                label.textContent = num;
                xCoordinatesBottomEl.appendChild(label);
            });
        }
    }    function getEmoji(type) {
        switch(type) {
            case 'Base': return '<img src="images/Base.png" alt="Base" class="icon-image">';
            case 'Wreck': return '<img src="images/Wreck.png" alt="Wreck" class="icon-image">';
            case 'Lab': return '<img src="images/Lab.png" alt="Lab" class="icon-image">';
            case 'Ring': return '<img src="images/Ring.png" alt="Ring" class="icon-image">';
            case 'Stravidium': return '<img src="images/Stravidium.png" alt="Stravidium" class="icon-image">';
            case 'Titanium': return '<img src="images/Titanium.png" alt="Titanium" class="icon-image">';
            case 'Control Point': return '<img src="images/ControlPoint.png" alt="Control Point" class="icon-image">';
            default: return '';
        }
    }    function createOrUpdateIcon(parent, type, isMainCell = false) {
        let icon = parent.querySelector('.item-icon');
        if (icon) icon.remove();

        if (!type) {
            parent.classList.remove('has-item');
            return null;
        }

        parent.classList.add('has-item');
        icon = document.createElement('div');
        icon.className = 'item-icon';
        parent.appendChild(icon);

        if (isMainCell && Array.isArray(type)) {
            icon.style.display = 'flex';
            icon.style.justifyContent = 'center';
            icon.style.alignItems = 'center';
            icon.innerHTML = type.slice(0, 3).map(t => getEmoji(t)).join('');
        } else if (type) {
            icon.innerHTML = getEmoji(type);
        } else {
            icon.innerHTML = '';
        }
        return icon;
    }

    function selectTool(type) {
        document.querySelectorAll('.legend-item').forEach(item => {
            if (item.dataset.type === type) {
                item.dataset.selected = "true";
            } else {
                delete item.dataset.selected;
            }
        });
        selectedTool = type;
    }

    // DRAG & DROP hoofd-legenda
    legendItems.forEach(function(item) {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', item.dataset.type);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', function() {
            item.classList.remove('dragging');
        });
        item.addEventListener('click', function() {
            selectTool(item.dataset.type);
        });
    });

    // DRAG & DROP popup-legenda
    popupLegendItems.forEach(function(item) {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', item.dataset.type);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', function() {
            item.classList.remove('dragging');
        });
        item.addEventListener('click', function() {
            selectTool(item.dataset.type);
        });
    });

    function enableSubCellDragAndDrop(subCell) {
        subCell.addEventListener('dragover', function(e) {
            e.preventDefault();
            subCell.classList.add('drag-over');
        });
        subCell.addEventListener('dragleave', function() {
            subCell.classList.remove('drag-over');
        });
        subCell.addEventListener('drop', function(e) {
            e.preventDefault();
            subCell.classList.remove('drag-over');
            const type = e.dataTransfer.getData('text/plain');
            if (type) {
                subCell.classList.add('has-item');
                subCell.dataset.type = type;
                createOrUpdateIcon(subCell, type);
                updateMainCellDisplay();
                saveMapState();
            }
        });
    }

    // DARK MODE
    const darkModeBtn = document.getElementById('toggleDarkMode');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('duneDarkMode', document.body.classList.contains('dark-mode') ? '1' : '0');
        });
        // Init state
        if (localStorage.getItem('duneDarkMode') === '1') {
            document.body.classList.add('dark-mode');
        }
    }

    // (Fake) samenwerking-indicator: pulse effect
    const collab = document.getElementById('collabIndicator');
    if (collab) {
        setInterval(() => {
            collab.style.opacity = '0.5';
            setTimeout(() => { collab.style.opacity = '1'; }, 400);
        }, 2000);
    }

    // NOTITIEVELD per gridcel
    const noteTextarea = document.getElementById('cellNote');
    let currentNoteKey = null;
    function saveNote() {
        if (currentNoteKey && noteTextarea) {
            localStorage.setItem(currentNoteKey, noteTextarea.value);
        }
    }
    if (noteTextarea) {
        noteTextarea.addEventListener('input', saveNote);
    }

    // Popup open/close animatie (extra fade)
    function openPopup() {
        popupOverlay.classList.add('active');
        popup.classList.remove('fadeOut');
        popup.classList.add('fadeIn');
    }
    function closePopup() {
        popup.classList.remove('fadeIn');
        popup.classList.add('fadeOut');
        setTimeout(() => {
            popupOverlay.classList.remove('active');
            selectedCell = null;
        }, 200);
    }
    closePopupButton.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) closePopup();
    });

    // Pas handleCellClick aan voor notities en animatie
    function handleCellClick(cell) {
        selectedCell = cell;
        const coordinates = cell.dataset.coordinates;
        if (cellCoordinatesSpan) cellCoordinatesSpan.textContent = coordinates;
        if (popupCoordinatesSpan) popupCoordinatesSpan.textContent = coordinates;
        popupSubGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const subCell = document.createElement('div');
            subCell.className = 'sub-cell';
            subCell.dataset.index = i;
            const subCellsState = getSavedSubCellsState(coordinates);
            if (subCellsState && subCellsState[i]) {
                subCell.classList.add('has-item');
                subCell.dataset.type = subCellsState[i];
                createOrUpdateIcon(subCell, subCellsState[i]);
            }
            subCell.addEventListener('click', function() {
                // Als er al een icoon staat: verwijder deze (toggle functionaliteit)
                if (subCell.classList.contains('has-item')) {
                    subCell.classList.remove('has-item');
                    subCell.removeAttribute('data-type');
                    const icon = subCell.querySelector('.item-icon');
                    if (icon) icon.remove();
                    updateMainCellDisplay();
                    saveMapState();
                    return;
                }
                // Anders: plaats icoon zoals normaal
                if (!selectedTool) {
                    alert('Selecteer eerst een icoon uit de legenda!');
                    return;
                }
                subCell.classList.add('has-item');
                subCell.dataset.type = selectedTool;
                createOrUpdateIcon(subCell, selectedTool);
                updateMainCellDisplay();
                saveMapState();
            });
            enableSubCellDragAndDrop(subCell);
            popupSubGrid.appendChild(subCell);
        }
        // Notitie laden
        currentNoteKey = 'note_' + coordinates;
        if (noteTextarea) {
            noteTextarea.value = localStorage.getItem(currentNoteKey) || '';
        }
        // Sticky note laden
        currentStickyKey = 'sticky_' + coordinates;
        if (stickyNoteText) {
            stickyNoteText.value = localStorage.getItem(currentStickyKey) || '';
        }
        stickyNote.style.display = 'none';
        openPopup();
        // Direct main grid iconen updaten bij openen popup
        updateMainCellDisplay();
    }

    function updateMainCellDisplay() {
        if (!selectedCell) return;
        const coordinates = selectedCell.dataset.coordinates;
        const itemCells = Array.from(popupSubGrid.querySelectorAll('.sub-cell.has-item'));
        // Sticky note check
        const noteKey = 'note_' + coordinates;
        const noteValue = localStorage.getItem(noteKey);
        // Verwijder oude sticky note icon als die er is
        let stickyIcon = selectedCell.querySelector('.sticky-note-icon');
        if (stickyIcon) stickyIcon.remove();
        // Normale iconen
        if (itemCells.length === 0) {
            selectedCell.classList.remove('has-item');
            const mainCellIcon = selectedCell.querySelector('.item-icon');
            if (mainCellIcon) mainCellIcon.remove();
        } else if (itemCells.length === 1) {
            selectedCell.classList.add('has-item');
            const type = itemCells[0].dataset.type;
            createOrUpdateIcon(selectedCell, type, false);
        } else {
            selectedCell.classList.add('has-item');
            const types = itemCells.map(cell => cell.dataset.type).slice(0, 3);
            createOrUpdateIcon(selectedCell, types, true);
        }
        // Sticky note icoon toevoegen als er een note is
        if (noteValue && noteValue.trim() !== '') {
            const noteImg = document.createElement('img');
            noteImg.src = 'images/Note.png';
            noteImg.alt = 'Sticky Note';
            noteImg.className = 'sticky-note-icon';
            noteImg.style.position = 'absolute';
            noteImg.style.top = '2px';
            noteImg.style.right = '2px';
            noteImg.style.width = '18px';
            noteImg.style.height = '18px';
            noteImg.style.zIndex = '3';
            selectedCell.appendChild(noteImg);
        }
    }

    function getSavedSubCellsState(coordinates) {
        const savedState = localStorage.getItem('duneMapState');
        if (savedState) {
            const mapState = JSON.parse(savedState);
            return mapState[coordinates];
        }
        return null;
    }

    // URL state management functies
    function saveStateToURL(mapState) {
        const state = {
            map: mapState,
            dark: document.body.classList.contains('dark-mode')
        };
        const stateStr = btoa(JSON.stringify(state)); // encode state naar base64
        window.history.replaceState(null, '', `#${stateStr}`);
    }

    function loadStateFromURL() {
        try {
            const hash = window.location.hash.slice(1);
            if (!hash) return null;
            
            const state = JSON.parse(atob(hash)); // decode base64 naar object
            if (state.dark) {
                document.body.classList.add('dark-mode');
            }
            return state.map;
        } catch (e) {
            console.error('Error loading state from URL:', e);
            return null;
        }
    }

    // Pas de save en load functies aan
    function saveMapState() {
        const mapState = {};
        document.querySelectorAll('.cell').forEach(cell => {
            const coordinates = cell.dataset.coordinates;
            let subCellsState = null;
            if (cell === selectedCell) {
                const subCells = Array.from(popupSubGrid.querySelectorAll('.sub-cell'));
                subCellsState = subCells.map(subCell => {
                    if (subCell.classList.contains('has-item')) {
                        const icon = subCell.querySelector('.item-icon img');
                        return icon ? icon.alt : null;
                    }
                    return null;
                });
            } else {
                subCellsState = getSavedSubCellsState(coordinates);
            }
            if (subCellsState && subCellsState.some(state => state !== null)) {
                mapState[coordinates] = subCellsState;
            }
        });
        // Sla op in localStorage en URL
        localStorage.setItem('duneMapState', JSON.stringify(mapState));
        saveStateToURL(mapState);
    }

    function loadMapState() {
        // Probeer eerst te laden van URL, dan van localStorage
        const urlState = loadStateFromURL();
        const savedState = urlState || JSON.parse(localStorage.getItem('duneMapState') || '{}');

        // Reset alle cellen
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('has-item');
            let icon = cell.querySelector('.item-icon');
            if (icon) icon.remove();
            let stickyIcon = cell.querySelector('.sticky-note-icon');
            if (stickyIcon) stickyIcon.remove();
        });

        Object.entries(savedState).forEach(([coordinates, subCellsState]) => {
            const cell = document.querySelector(`.cell[data-coordinates="${coordinates}"]`);
            if (cell && subCellsState) {
                const items = subCellsState.filter(Boolean);
                if (items.length > 0) {
                    cell.classList.add('has-item');
                    createOrUpdateIcon(cell, items.length === 1 ? items[0] : items, true);
                }
            }
        });
    }

    closePopupButton.addEventListener('click', function() {
        popupOverlay.classList.remove('active');
        selectedCell = null;
    });

    // Popup-legenda: selecteren van tool
    document.querySelector('.popup-legend .legend-items').addEventListener('click', function(e) {
        const legendItem = e.target.closest('.legend-item');
        if (legendItem) {
            selectTool(legendItem.dataset.type);
        }
    });

    // Clear-knop is verwijderd; functionaliteit nu via subcell click (toggle)

    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            popupOverlay.classList.remove('active');
            selectedCell = null;
        }
    });

    // Export als afbeelding
    const exportBtn = document.getElementById('exportMapBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const mapContainer = document.querySelector('.map-container');
            if (!mapContainer) return;
            html2canvas(mapContainer, {backgroundColor: null}).then(canvas => {
                const link = document.createElement('a');
                link.download = 'dune-map.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        });
    }

    // Sticky note functionaliteit
    const infoBtn = document.getElementById('popupInfoBtn');
    const stickyNote = document.getElementById('popupStickyNote');
    const stickyNoteText = document.getElementById('stickyNoteText');
    let currentStickyKey = null;
    if (infoBtn && stickyNote && stickyNoteText) {
        infoBtn.addEventListener('click', function() {
            stickyNote.style.display = stickyNote.style.display === 'none' ? 'block' : 'none';
        });
        stickyNoteText.addEventListener('input', function() {
            if (currentStickyKey) {
                localStorage.setItem(currentStickyKey, stickyNoteText.value);
            }
        });
    }

    // Ship note functionaliteit
    const crashingShipBtn = document.getElementById('crashingShipBtn');
    const shipNotePopup = document.getElementById('shipNotePopup');
    const closeShipNote = document.getElementById('closeShipNote');
    const shipNoteText = document.getElementById('shipNoteText');
    
    if (crashingShipBtn && shipNotePopup && closeShipNote && shipNoteText) {
        // Laad bestaande notitie
        shipNoteText.value = localStorage.getItem('shipNote') || '';
        
        // Open popup bij klik op schip
        crashingShipBtn.addEventListener('click', function() {
            shipNotePopup.style.display = 'block';
        });
        
        // Sluit popup
        closeShipNote.addEventListener('click', function() {
            shipNotePopup.style.display = 'none';
        });
        
        // Sla notitie op bij typen
        shipNoteText.addEventListener('input', function() {
            localStorage.setItem('shipNote', shipNoteText.value);
            showSaveFeedback(); // Gebruik dezelfde feedback als bij andere notities
        });
        
        // Sluit popup bij klik buiten
        document.addEventListener('click', function(e) {
            if (shipNotePopup.style.display === 'block' && 
                !shipNotePopup.contains(e.target) && 
                e.target !== crashingShipBtn) {
                shipNotePopup.style.display = 'none';
            }
        });
    }

    // Animatie van het crashende schip is verwijderd
    
    initializeGrid();
    loadMapState();

    // Real-time update functies
    let lastHash = window.location.hash;
    function showSavedFeedback(msg) {
        let feedback = document.getElementById('savedFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'savedFeedback';
            feedback.style.position = 'fixed';
            feedback.style.top = '30px';
            feedback.style.left = '50%';
            feedback.style.transform = 'translateX(-50%)';
            feedback.style.background = '#222';
            feedback.style.color = '#fff';
            feedback.style.padding = '10px 24px';
            feedback.style.borderRadius = '8px';
            feedback.style.zIndex = '9999';
            feedback.style.fontSize = '1.2em';
            document.body.appendChild(feedback);
        }
        feedback.textContent = msg || 'Saved!!';
        feedback.style.display = 'block';
        setTimeout(() => { feedback.style.display = 'none'; }, 1200);
    }

    function checkForUpdates() {
        const currentHash = window.location.hash;
        if (currentHash !== lastHash) {
            lastHash = currentHash;
            // Laad de nieuwe kaartdata
            if (selectedCell) closePopup();
            loadMapState();
            showSavedFeedback('Kaart bijgewerkt!');
            // Dark mode sync
            const urlState = loadStateFromURL();
            if (urlState && typeof urlState.dark !== 'undefined') {
                if (urlState.dark) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            }
        }
    }
    setInterval(checkForUpdates, 5000);
    window.addEventListener('hashchange', () => {
        lastHash = window.location.hash;
        loadMapState();
    });
});
