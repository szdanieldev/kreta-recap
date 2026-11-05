import { useEffect, useId, useRef, useState } from 'react';
export type Institution = { code: string; name: string };
export function InstitutionSearch({ value, onChange, disabled }: { value: Institution | null; onChange: (value: Institution | null) => void; disabled: boolean }) {
  const [query, setQuery] = useState(value?.name ?? ''), [items, setItems] = useState<Institution[]>([]), [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(''), [active, setActive] = useState(-1);
  const id = useId(), root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    if (value || query.trim().length < 3) { setItems([]); setLoading(false); setError(''); return; }
    const controller = new AbortController(); setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/institutions?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const result = await response.json(); if (!response.ok) throw new Error(result.error || 'A kereső most nem elérhető.');
        setItems(result.institutions); setActive(-1);
      } catch (e) { if (!controller.signal.aborted) { setError(e instanceof Error ? e.message : 'A kereső most nem elérhető.'); setItems([]); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, value]);
  function select(item: Institution) { onChange(item); setQuery(item.name); setOpen(false); setActive(-1); }
  const code = query.trim().toLowerCase();
  const manual = !loading && !value && query.trim().length >= 3 && /^[a-z0-9][a-z0-9-]{2,62}$/.test(code) && (!!error || /^(klik\d|[a-z]+-)/.test(code));
  return <div className="school-search" ref={root}>
    <label htmlFor={`${id}-input`}>Iskolád</label>
    <div className={`school-input ${value ? 'selected' : ''}`}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Zm4 3v5c3 3 7 3 10 0v-5M21 9v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg><input id={`${id}-input`} name="school-search" role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls={`${id}-list`} aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} placeholder="Iskolanév vagy település…" value={query} disabled={disabled} autoComplete="off" autoCapitalize="none" onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); onChange(null); setOpen(true); setActive(-1); }} onKeyDown={event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, items.length - 1)); }
      if (event.key === 'ArrowUp' && items.length) { event.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
      if (event.key === 'Enter' && open && active >= 0 && items[active]) { event.preventDefault(); select(items[active]); }
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    }}/><span className="school-status" aria-hidden="true">{loading ? <span className="spinner"/> : value ? '✓' : '⌄'}</span></div>
    {open && !value && <div className="school-dropdown"><div id={`${id}-list`} role="listbox" aria-label="Intézmények">{items.map((item, i) => <button type="button" role="option" aria-selected={active === i} id={`${id}-${i}`} key={item.code} className={i === active ? 'active' : ''} onPointerDown={e => e.preventDefault()} onClick={() => select(item)}><span>{item.name}</span><small>{item.code}</small></button>)}</div>
      {loading && <p role="status">Iskolák keresése…</p>}{!loading && error && <p role="status">{error}</p>}{!loading && !error && items.length === 0 && <p role="status">{query.trim().length < 3 ? 'Írj be legalább 3 betűt.' : 'Nincs találat. Próbáld a település nevét.'}</p>}
      {manual && <button type="button" className="school-manual" onClick={() => select({ code, name: `Intézménykód: ${code}` })}>Intézménykódként használom: <b>{code}</b></button>}
    </div>}
    {value && <span className="school-picked">Kiválasztva · {value.code}</span>}
  </div>;
}
