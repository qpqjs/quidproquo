import { ActionSearchFieldDefinition, ActionSearchFieldType, ActionSearchFilter, ActionSearchFilterOperator } from 'quidproquo-features';

import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

type FilterFieldControlProps = {
  field: ActionSearchFieldDefinition;
  filter?: ActionSearchFilter;
  onFilterChange: (field: ActionSearchFieldDefinition, partial: Partial<ActionSearchFilter>) => void;
};

const FilterFieldControl = ({ field, filter, onFilterChange }: FilterFieldControlProps) => {
  const inputType = field.type === ActionSearchFieldType.Number ? 'number' : 'text';

  if (field.operator === ActionSearchFilterOperator.Range) {
    return (
      <>
        <Grid item xs={2}>
          <FormControl fullWidth>
            <TextField
              InputLabelProps={{ shrink: true }}
              label={`${field.label} (min)`}
              onChange={(event) => onFilterChange(field, { rangeStart: event.target.value })}
              type={inputType}
              value={filter?.rangeStart ?? ''}
            />
          </FormControl>
        </Grid>
        <Grid item xs={2}>
          <FormControl fullWidth>
            <TextField
              InputLabelProps={{ shrink: true }}
              label={`${field.label} (max)`}
              onChange={(event) => onFilterChange(field, { rangeEnd: event.target.value })}
              type={inputType}
              value={filter?.rangeEnd ?? ''}
            />
          </FormControl>
        </Grid>
      </>
    );
  }

  if (field.type === ActionSearchFieldType.Enum) {
    return (
      <Grid item xs={2}>
        <FormControl fullWidth>
          <InputLabel id={`filter-${field.name}-label`}>{field.label}</InputLabel>
          <Select
            label={field.label}
            labelId={`filter-${field.name}-label`}
            onChange={(event) => onFilterChange(field, { value: event.target.value })}
            value={filter?.value ?? ''}
          >
            <MenuItem value="">Any</MenuItem>
            {(field.enumValues ?? []).map((enumValue) => (
              <MenuItem key={enumValue} value={enumValue}>
                {enumValue}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  }

  return (
    <Grid item xs={2}>
      <FormControl fullWidth>
        <TextField
          InputLabelProps={{ shrink: true }}
          label={field.label}
          onChange={(event) => onFilterChange(field, { value: event.target.value })}
          type={inputType}
          value={filter?.value ?? ''}
        />
      </FormControl>
    </Grid>
  );
};

type ActionSearchFilterFormProps = {
  fields: ActionSearchFieldDefinition[];
  filters: ActionSearchFilter[];
  onFiltersChange: (filters: ActionSearchFilter[]) => void;
};

export const ActionSearchFilterForm = ({ fields, filters, onFiltersChange }: ActionSearchFilterFormProps) => {
  const getFilter = (fieldName: string) => filters.find((filter) => filter.fieldName === fieldName);

  const handleFilterChange = (field: ActionSearchFieldDefinition, partial: Partial<ActionSearchFilter>) => {
    const existing = getFilter(field.name);
    const updated: ActionSearchFilter = {
      fieldName: field.name,
      operator: field.operator,
      ...existing,
      ...partial,
    };

    onFiltersChange([...filters.filter((filter) => filter.fieldName !== field.name), updated]);
  };

  return (
    <Grid columns={12} container spacing={2}>
      {fields.map((field) => (
        <FilterFieldControl key={field.name} field={field} filter={getFilter(field.name)} onFilterChange={handleFilterChange} />
      ))}
    </Grid>
  );
};
