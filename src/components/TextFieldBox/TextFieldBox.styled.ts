import { styled } from '@mui/material/styles'
import type { TextFieldProps } from '@mui/material/TextField'
import TextField from '@mui/material/TextField'

export const TextFieldStyled: React.ComponentType<TextFieldProps> = styled(
  TextField
)`
  min-width: 0;

  /* A single centered character needs no side padding; dropping it keeps
     digits whole when six slots share a phone-width row. */
  input {
    padding-left: 0;
    padding-right: 0;
    text-align: center;
  }
`
