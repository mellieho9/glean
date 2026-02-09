import Header from "./Header";
import ProgressSteps from "./ProgressSteps";

export default function PageLayout({ children, center, step, title, description }) {
  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">
      <Header/>
      <main
        className={
          center
            ? "flex-grow flex flex-col items-center justify-center px-6"
            : "flex-grow"
        }
      >
        {step != null ? (
          <div className="w-full">
            <ProgressSteps currentStep={step} />

            <div className="bg-white p-8">
              <div className="mb-8 text-center">
                {title && <h1 className="text-2xl font-bold mb-2">{title}</h1>}
                {description && <p className="text-slate-500">{description}</p>}
              </div>

              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
