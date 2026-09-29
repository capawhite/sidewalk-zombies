// On-screen error overlay for development.

function showError(msg: string) {
  let box = document.getElementById('err');
  if (!box) {
    box = document.createElement('div');
    box.id = 'err';
    document.getElementById('wrap')!.appendChild(box);
  }
  box.textContent = 'Error: ' + msg;
}
window.addEventListener('error', (e) => showError(e.message));
window.addEventListener('unhandledrejection', (e: any) => showError(String(e.reason)));