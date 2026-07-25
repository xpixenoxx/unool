import { Suspense } from 'react';
import { Shield } from 'lucide-react';
import { Box, Flex, Text } from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';
import { EmailLoginForm } from './EmailLoginForm';

function LoadingFallback() {
  return (
    <MotionBox
      variant="fade"
      className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12"
    >
      <Box className="w-full max-w-md">
        <Flex centerX className="mb-4">
          <Box className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-7 w-7" />
          </Box>
        </Flex>
        <Text size="xl" weight="bold" className="text-center" color="foreground">
          Admin Dashboard
        </Text>
        <Text size="lg" className="text-center" color="muted">
          Loading...
        </Text>
      </Box>
    </MotionBox>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmailLoginForm />
    </Suspense>
  );
}