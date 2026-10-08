export function setNonce(el: Element, nonce?: string): void {
  if (nonce) {
    el.setAttribute('nonce', nonce);
  }
}
