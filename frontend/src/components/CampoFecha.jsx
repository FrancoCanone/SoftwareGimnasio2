import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('es', es)

function isoAFecha(iso) {
  if (!iso) return null
  const [año, mes, dia] = iso.split('-').map(Number)
  return new Date(año, mes - 1, dia)
}

function fechaAIso(fecha) {
  if (!fecha) return ''
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${año}-${mes}-${dia}`
}

function CampoFecha({ label, value, onChange, error, required = false, maxDate, minDate }) {
  return (
    <label className="cliente-form-campo">
      <span>{label}{required && ' *'}</span>
      <DatePicker
        selected={isoAFecha(value)}
        onChange={(fecha) => onChange(fechaAIso(fecha))}
        dateFormat="dd/MM/yyyy"
        locale="es"
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
        maxDate={maxDate}
        minDate={minDate}
        placeholderText="dd/mm/aaaa"
        className={error ? 'con-error' : ''}
        
      />
      {error && <small className="cliente-form-error">{error}</small>}
    </label>
  )
}

export default CampoFecha