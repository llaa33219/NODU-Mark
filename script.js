document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');

    const sampleText = `# Welcome to NODU Mark! #
You can test the NODU Mark syntax in real-time here.

----

-#Key Syntax Examples#-

[|This is bold text|]
*/This is italic text/*
-This is strikethrough-
~This is wavy text~
%#FF5733:This text is orange.%

!!!This text is slightly larger!!!

- Unordered List 1
- Unordered List 2

!- Ordered List 1
!- Ordered List 2

([This is a speech bubble.])
{[This is a thought bubble.]}

[!https://img.bloupla.net/gGWaG5QJ?raw=1!]
`;

    editor.value = sampleText;


    const parseNoduMark = (text) => {
        let html = text;

        // Escape HTML to prevent weirdness
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Line-by-line processing for lists
        const lines = html.split('\n');
        let inUl = false;
        let inOl = false;
        let processedLines = [];

        for(let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Unordered Lists
            if (line.trim().startsWith('- ')) {
                if (!inUl) {
                    processedLines.push('<ul>');
                    inUl = true;
                }
                processedLines.push(`<li>${line.trim().substring(2)}</li>`);
            } else {
                if (inUl) {
                    processedLines.push('</ul>');
                    inUl = false;
                }
            }

            // Ordered Lists
            if (line.trim().startsWith('!- ')) {
                if (!inOl) {
                    processedLines.push('<ol>');
                    inOl = true;
                }
                processedLines.push(`<li>${line.trim().substring(3)}</li>`);
            } else {
                if (inOl) {
                    processedLines.push('</ol>');
                    inOl = false;
                }
            }

            if (!line.trim().startsWith('- ') && !line.trim().startsWith('!- ')) {
                 // Close dangling lists at the end of a block
                if (inUl) {
                    processedLines.push('</ul>');
                    inUl = false;
                }
                if (inOl) {
                    processedLines.push('</ol>');
                    inOl = false;
                }
                processedLines.push(line);
            }
        }
        
        // Close any open lists at the end of the document
        if (inUl) processedLines.push('</ul>');
        if (inOl) processedLines.push('</ol>');
        
        html = processedLines.join('\n');

        // Block elements that should be on their own line
        // Headings (up to 20 levels)
        html = html.replace(/^(-{0,19})#(.*?)#(-{0,19})$/gm, (match, p1, p2) => {
            const level = p1.length + 1;
            return `<h${level}>${p2.trim()}</h${level}>`;
        });
        
        // Horizontal Rule
        html = html.replace(/^----$/gm, '<hr>');
        
        // Inline elements
        // Bold
        html = html.replace(/\[\|(.*?)\|\]/g, '<strong>$1</strong>');
        // Italic
        html = html.replace(/\*\/(.*?)\/\*/g, '<em>$1</em>');
        // Strikethrough
        html = html.replace(/-(.*?)-/g, '<s>$1</s>');
        // Wavy
        html = html.replace(/~(.*?)~/g, '<span class="wavy-text">$1</span>');
        // Color
        html = html.replace(/%([^:]+):(.*?)%/g, '<span style="color: $1;">$2</span>');
        // Larger Text
        html = html.replace(/!!!(.*?)!!!/g, '<span class="large-text">$1</span>');
        // Image
        html = html.replace(/\[!(.*?)!\]/g, '<img src="$1" alt="NODU Mark Image">');
        // Speech Bubble
        html = html.replace(/\(\[(.*?)\]\)/g, '<div class="speech-bubble">$1</div>');
        // Thought Bubble
        html = html.replace(/\{\[(.*?)\]\}/g, '<div class="thought-bubble">$1</div>');

        // Replace newlines with <br>, but not inside list items or after block elements
        html = html.replace(/<\/ul>\n/g, '</ul>')
                   .replace(/<\/ol>\n/g, '</ol>')
                   .replace(/<\/li>\n/g, '</li>');

        html = html.split('\n').map(line => {
            if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol') || line.startsWith('<li') || line.startsWith('</ul') || line.startsWith('</ol') || line.startsWith('</li') || line.startsWith('<hr') || line.startsWith('<div') || line.trim() === '') {
                return line;
            }
            return line + '<br>';
        }).join('');
        
        // Cleanup unnecessary <br> tags
        html = html.replace(/<br>(?=<\/h[1-6]>|<hr>|<div|<\/div>|<ul>|<ol>|<\/ul>|<\/ol>|<\/li>)/g, '');
        html = html.replace(/(<h[1-6]>|<hr>|<div|<\/div>|<ul>|<ol>|<\/ul>|<\/ol>|<li>|<\/li>)<br>/g, '$1');


        return html.replace(/<br>\s*<br>/g, '<br>'); // Prevent double breaks
    };

    const applyWavyEffect = () => {
        const wavyElements = document.querySelectorAll('.wavy-text');
        wavyElements.forEach(el => {
            if (el.dataset.wavyApplied) return;

            const text = el.textContent;
            el.innerHTML = '';
            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                if (char === ' ') {
                    span.innerHTML = '&nbsp;';
                } else {
                    span.textContent = char;
                    span.style.animationDelay = `${index * 0.1}s`;
                }
                el.appendChild(span);
            });
            el.dataset.wavyApplied = true;
        });
    };

    const updatePreview = () => {
        const text = editor.value;
        const html = parseNoduMark(text);
        preview.innerHTML = html;
        // Reset applied status for preview elements
        preview.querySelectorAll('.wavy-text').forEach(el => delete el.dataset.wavyApplied);
        applyWavyEffect();
    };

    editor.addEventListener('input', updatePreview);

    // Initial parse
    updatePreview();
});
