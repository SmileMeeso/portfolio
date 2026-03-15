import { useState } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Box } from '@mui/material'
import GNB from '../components/GNB'
import LNB from '../components/LNB'

function RootLayout() {
  const [lnbOpen, setLnbOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GNB onMenuOpen={() => setLnbOpen(true)} />
      <LNB open={lnbOpen} onClose={() => setLnbOpen(false)} />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <TanStackRouterDevtools />
    </Box>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
