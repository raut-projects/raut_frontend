import OnboardingLayout from '../components/OnboardingLayout';
import PersonalInfoStep from '../components/onboarding/PersonalInfoStep';
import DriverInfoStep from '../components/onboarding/DriverInfoStep';
import VehicleInfoStep from '../components/onboarding/VehicleInfoStep';
import DocumentsStep from '../components/onboarding/DocumentsStep';
import ReviewStep from '../components/onboarding/ReviewStep';
import useOnboardingStore from '../store/onboardingStore';

export default function Onboarding() {
  const { currentStep } = useOnboardingStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep />;
      case 2:
        return <DriverInfoStep />;
      case 3:
        return <VehicleInfoStep />;
      case 4:
        return <DocumentsStep />;
      case 5:
        return <ReviewStep />;
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
