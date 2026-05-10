import { STORE } from '@/lib/content/store';

export function MapEmbed() {
  return (
    <iframe
      title={`Mapa: ${STORE.name}, ${STORE.street}`}
      src={STORE.embedUrl}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        display: 'block',
      }}
    />
  );
}
