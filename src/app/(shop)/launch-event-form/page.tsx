import LaunchEventForm from '@/components/LaunchEventForm';

export default function LaunchEventFormPage() {
  return (
    <div className="min-h-screen jove-bg-primary">
      {/* Header Section - Mobile & iPad Responsive */}
      <div className="jove-bg-gradient border-b jove-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-zinc-900 tracking-wider mb-3 sm:mb-4">
            JOVÉ LAUNCH EVENT
          </h1>
          <div className="w-20 sm:w-24 md:w-32 h-px jove-gradient-accent mx-auto mb-4 sm:mb-6"></div>
          <p className="text-base sm:text-lg md:text-xl font-light text-zinc-700 tracking-wide max-w-3xl mx-auto leading-relaxed px-2">
            Welcome to our exclusive launch event. We're delighted to have you join us as we unveil our custom jewelry collection.
          </p>
        </div>
      </div>
      
      {/* Form Section - Mobile & iPad Responsive */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <LaunchEventForm />
      </div>
    </div>
  );
}
