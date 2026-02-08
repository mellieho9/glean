import Button from "./Button";

export default function NavFooter({ backTo, nextTo, nextDisabled = false }) {
  return (
    <div className="mt-10 pt-6 flex flex-row gap-3">
      <Button variant="ghost" to={backTo} className="w-full py-2 px-4">
        Go Back
      </Button>
      <Button to={nextTo} disabled={nextDisabled} className="w-full py-4 px-4">
        Next
      </Button>
    </div>
  );
}
