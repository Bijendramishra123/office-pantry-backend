import { Alert, AlertTitle, Box, Button } from '@mui/material'
import { Refresh } from '@mui/icons-material'

const Error = ({ message = 'Something went wrong', onRetry, title = 'Error' }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Alert 
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry} startIcon={<Refresh />}>
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  )
}

export default Error
