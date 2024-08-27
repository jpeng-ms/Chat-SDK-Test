import { FormField } from './FormField'

export const RadioGroup = ({
  label,
  field: { name, value, ...fieldProps },
  form,
  required,
  options,
  defaultValue,
  ...props
}) => {
  return (
    <FormField id={name} label={label} required={required} formProps={form} defaultValue={defaultValue}>
      {options.map((option) => (
        <div key={option.value}>
          <input
            type="radio"
            id={option.value}
            name={name}
            value={option.value}
            checked={option.value === value}
            disabled={option.disabled}
            defaultValue={option.value}
            {...fieldProps}
            {...props}
          />
          {option.label}
        </div>
      ))}
    </FormField>
  )
}
