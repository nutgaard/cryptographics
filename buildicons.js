const fs = require('fs');
const svg2png = require('svg2png');

//svg2png icon.svg --output=output.png --width=48 --height=48

function saveToSize(data, size) {
    svg2png(data, { height: size, width: size})
        .then((buffer) => fs.writeFile(`./public/icon${size}.png`, buffer))
        .then(() => console.log(`Icon ${size} created...`));
}

fs.readFile('./icon.svg', (err, data) => {
    saveToSize(data, 48);
    saveToSize(data, 72);
    saveToSize(data, 96);
    saveToSize(data, 144);
    saveToSize(data, 168);
    saveToSize(data, 192);
    saveToSize(data, 256);
    saveToSize(data, 512);
});