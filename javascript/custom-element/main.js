class WordCount extends HTMLParagraphElement {
    constructor() {
        super()

        //
        var wcParent = this.parentNode;

        function countWords(node) {
            var text = node.innerText || node.textContent;
            return text.split(/\s+/g).length;
        }

        var count = "Words：" + this.countWords(this.wcParent);

        // 为影子DOM创建根
        var shadow = this.attachShadow({mode: "open"});

        // 创建一个span并添加内容
        var text = document.createElement("span");
        text.textContent = count;

        // 挂载到影子DOM上
        shadow.appendChild(text);

        // 更新内容改变的时候更新count
        setInterval(function () {
            var count = "Words：" + countWords(wcParent);
            text.textContent = count;
        }, 200);
    }
}

// 定义一个新的组件
customElements.define("word-count", WordCount, {extends: 'p'});


customElements.define('element-details',
    class extends HTMLElement {
        constructor() {
            super();
            const template = document.getElementById('element-details-template').content;
            const shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.cloneNode(true));
        }
    }
);