document.querySelectorAll('[data-amt]').forEach(b => b.onclick = () => {
  document.getElementById('amount').value = b.dataset.amt;
  document.querySelectorAll('[data-amt]').forEach(x => x.classList.toggle('on', x === b));
});
const q = document.getElementById('q');
if (q) {
  let f = 'all';
  const run = () => document.querySelectorAll('tbody tr[data-name]').forEach(r =>
    r.hidden = !(r.dataset.name.includes(q.value.trim().toLowerCase()) && (f === 'all' || r.dataset.s === f)));
  q.oninput = run;
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    f = b.dataset.f; run();
    document.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b));
  });
}
