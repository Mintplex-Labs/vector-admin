export default function PreLoader() {
  return (
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-white border-t-transparent"></div>
  );
}

export function FullScreenLoader() {
  return (
    <div
      id="preloader"
      className="fixed left-0 top-0 z-999999 flex h-screen w-screen items-center justify-center bg-main-bg"
    >
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
}
