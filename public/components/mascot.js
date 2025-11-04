export class MascotBubble{
  constructor({container, avatar}){
    this.container = container;
    this.avatar = avatar;
    this.root = document.createElement('div');
    this.root.className = 'mascot-bubble';
    this.root.setAttribute('aria-live','polite');
    this.root.innerHTML = `
      <div class="bubble" role="status"><span>Olá! Eu sou o DON.</span></div>
      <div class="avatar" aria-hidden="true">
        <img src="${avatar}" alt="" width="40" height="40" />
      </div>
    `;
    container.appendChild(this.root);
  }
  say(message){
    const bubble = this.root.querySelector('.bubble');
    bubble.innerHTML = `<span>${message}</span>`;
  }
  hide(){ this.root.style.display = 'none'; }
  show(){ this.root.style.display = 'flex'; }
}
