import Icon from './Icon.jsx';
export default function QtyStepper({ value, max = 99, onChange, label = 'Quantity' }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease"><Icon name="minus" size={16} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase"><Icon name="plus" size={16} /></button>
    </div>
  );
}
