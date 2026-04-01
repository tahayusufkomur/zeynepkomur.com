export function HoneypotField() {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
