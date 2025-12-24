
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
        { class: 'corner space-go', style: 'bottom:0;right:0;' },
        { class: 'corner space-parking', style: 'top:0;left:0;' },
        { class: 'corner space-jail', style: 'top:0;right:0;' },
        { class: 'corner space-go-jail', style: 'bottom:0;left:0;' }
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





