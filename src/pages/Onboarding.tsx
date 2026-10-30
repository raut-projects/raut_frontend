import { useEffect } from 'react';
import OnboardingLayout from '../components/OnboardingLayout';
import PersonalInfoStep from '../onboarding/PersonalInfoStep';
import DriverInfoStep from '../onboarding/DriverInfoStep';
import VehicleInfoStep from '../onboarding/VehicleInfoStep';
import PaymentDetailsStep from '../onboarding/PaymentDetailsStep';
import useOnboardingStore from '../store/onboardingStore';
import { updateTokens } from '../services/tokenStore';

export default function Onboarding() {
  const { currentStep, token } = useOnboardingStore();

  // Save token to localStorage on mount (for API authentication)
  useEffect(() => {
    if (token) {
      updateTokens({ accessToken: token });
    }
  }, [token]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep />;
      case 2:
        return <DriverInfoStep />;
      case 3:
        return <VehicleInfoStep />;
      case 4:
        return <PaymentDetailsStep />;
      default:
        return <PersonalInfoStep />;
    }
  };

  return (
    <OnboardingLayout>
      {renderStep()}
    </OnboardingLayout>
  );
}
