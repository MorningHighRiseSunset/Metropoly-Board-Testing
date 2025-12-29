
// Initialize the board and dynamically create spaces
document.addEventListener('DOMContentLoaded', function() {
    const board = document.querySelector('.board-3d');
    // Ensure board starts in 3D view
    board.style.transform = `rotateX(60deg) rotateZ(-45deg)`;
    const boardSpaces = document.querySelector('.board-spaces');

    // Helper to create a space
    function createSpace(classNames, dataSpace) {
        const div = document.createElement('div');
        div.className = 'space ' + classNames;
        if (dataSpace) div.setAttribute('data-space', dataSpace);
        return div;
    }

    // Board and tile sizing
    const boardSize = 800; // px (matches .board-3d in CSS)
    const cornerSize = 98; // px (matches .space.corner in CSS)
    const numSlivers = 9;
    const sliverLength = (boardSize - 2 * cornerSize) / numSlivers;

    // Place corners at true corners
    const corners = [
        { class: 'corner space-go', style: 'bottom:0;right:0;', data: 0 },
        { class: 'corner space-parking', style: 'top:0;left:0;', data: 20 },
        { class: 'corner space-jail', style: 'top:0;right:0;', data: 10 },
        { class: 'corner space-go-jail', style: 'bottom:0;left:0;', data: 30 }
    ];
    corners.forEach(corner => {
        // Cosmetic base tile (no event handlers, not interactive)
        const base = document.createElement('div');
        base.className = 'space corner-cosmetic';
        base.style.cssText += corner.style + 'z-index:0; background:#b0b0b0; position:absolute; width:' + cornerSize + 'px; height:' + cornerSize + 'px;';
        boardSpaces.appendChild(base);
        // Top interactive tile
        const div = createSpace(corner.class);
        div.style.cssText += corner.style + 'z-index:1; background:#f8f9fa; position:absolute; width:' + cornerSize + 'px; height:' + cornerSize + 'px; transform:translateZ(5px);';
        // assign canonical data-space number for corners
        if (corner.data !== undefined) div.setAttribute('data-space', corner.data);
        // small accessibility hint
        div.setAttribute('role', 'button');
        boardSpaces.appendChild(div);
    });

    // Add bottom row (spaces 1-9, right to left)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-bottom', i);
        div.style.top = '0';
        div.style.right = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = sliverLength + 'px';
        div.style.height = cornerSize + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }
    // Add left side (spaces 11-19, bottom to top)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-left', 10+i);
        div.style.left = '0';
        div.style.top = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = cornerSize + 'px';
        div.style.height = sliverLength + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }
    // Add top row (spaces 21-29, left to right)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-top', 20+i);
        div.style.bottom = '0';
        div.style.left = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = sliverLength + 'px';
        div.style.height = cornerSize + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }
    // Add right side (spaces 31-39, top to bottom)
    for (let i = 1; i <= numSlivers; i++) {
        const div = createSpace('space-right', 30+i);
        div.style.right = '0';
        div.style.bottom = (cornerSize + (i-1)*sliverLength) + 'px';
        div.style.width = cornerSize + 'px';
        div.style.height = sliverLength + 'px';
        div.style.transform = 'none';
        boardSpaces.appendChild(div);
    }

    // --- Tile names mapping and click/coordinate handler ---
    // Build a default name map: corners get names, others default to 'Tile N'
    const tileNames = {};
    // default numeric tiles
    for (let i = 1; i <= 39; i++) {
        tileNames[i] = 'Tile ' + i;
    }
    tileNames[0] = 'GO';
    tileNames[10] = 'JAIL';
    tileNames[20] = 'FREE PARKING';
    tileNames[30] = 'GO TO JAIL';

    // Create a GO sign element (fixed in viewport space)
    const goSign = document.createElement('div');
    goSign.className = 'go-sign';
    goSign.innerHTML = '<div class="go-sign-inner">GO</div>';
    // append to body because it's fixed-positioned
    document.body.appendChild(goSign);
    let goSignTimeout = null;
    function showGoSignAt(space) {
        if (!space) return;
        if (goSignTimeout) {
            clearTimeout(goSignTimeout);
            goSignTimeout = null;
        }
        // compute viewport center coords of the tile
        const rect = space.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const topOfTile = rect.top; // top edge in viewport coordinates
        // ensure the sign is visible for measuring
        goSign.classList.remove('show');
        goSign.style.opacity = '0';
        // measure sign size (offsetWidth is reliable even when opacity 0)
        const signW = goSign.offsetWidth || 140;
        const signH = goSign.offsetHeight || 64;
        // preferred placement: above the tile
        let left = Math.round(centerX - signW / 2);
        let top = Math.round(topOfTile - signH - 8); // place 8px above tile
        // If placing above would go off the top of the viewport, place below the tile instead
        if (top < 8) {
            top = Math.round(rect.bottom + 8);
        }
        // Clamp both values so the sign stays inside the viewport
        const minMargin = 8;
        const maxLeft = window.innerWidth - signW - minMargin;
        const maxTop = window.innerHeight - signH - minMargin;
        left = Math.min(Math.max(left, minMargin), Math.max(maxLeft, minMargin));
        top = Math.min(Math.max(top, minMargin), Math.max(maxTop, minMargin));
        goSign.style.left = left + 'px';
        goSign.style.top = top + 'px';
        // show with animation
        requestAnimationFrame(() => goSign.classList.add('show'));
        // auto-hide after 3s
        goSignTimeout = setTimeout(() => {
            goSign.classList.remove('show');
            goSignTimeout = setTimeout(() => { goSign.style.opacity = '0'; }, 220);
        }, 3000);
    }

    // Attach click handler to every interactive space (skip cosmetic)
    const allSpaces = boardSpaces.querySelectorAll('.space');
    allSpaces.forEach(space => {
        // ensure every space has a data-space attribute (if not, try to infer)
        let ds = space.getAttribute('data-space');
        if (ds === null) {
            // try to derive from classes like space-bottom, space-left, etc. Otherwise leave -1
            ds = '-1';
        }
        const dsNum = parseInt(ds, 10);
        const name = tileNames.hasOwnProperty(dsNum) ? tileNames[dsNum] : (dsNum > 0 ? ('Tile ' + dsNum) : (space.classList.contains('corner') ? 'Corner' : 'Unknown'));
        // set a title for hover and a data-name attribute
        space.setAttribute('title', name);
        space.setAttribute('data-name', name);
        // Click -> log name and center coordinates
        space.addEventListener('click', function (e) {
            const rect = space.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            console.log('Tile clicked:', name, '(data-space:', dsNum + '), center coords:', Math.round(centerX) + ',' + Math.round(centerY));
            // If this is the GO tile (data-space 0) show the GO sign at viewport coords
            if (dsNum === 0) showGoSignAt(space);
        });
    });

    // Removed UI and event handlers for moving tiles

    // Mouse drag to rotate board
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let rotationX = 60;
    let rotationZ = -45;

    boardSpaces.addEventListener('mousedown', function(e) {
        // Only left mouse button
        if (e.button !== 0) return;
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        // Prevent text selection
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        rotationZ += deltaX * 0.5;
        rotationX += deltaY * 0.5;
        rotationX = Math.max(30, Math.min(90, rotationX));
        board.style.transform = `rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // Optional: Prevent context menu on board
    boardSpaces.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    boardSpaces.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            animating = true;
        }
    });
    boardSpaces.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            targetRotationZ += deltaX * 0.5;
            targetRotationX += deltaY * 0.5;
            targetRotationX = Math.max(30, Math.min(90, targetRotationX));
            if (!animating) {
                animating = true;
                requestAnimationFrame(animateBoardRotation);
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });

    console.log('3D Board initialized!');
    console.log('Click and drag to rotate the board');
    console.log('Click on spaces to interact');
});





