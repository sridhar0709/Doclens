export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-[#3730A3] via-[#1E1B4B] to-[#312E81]">
      <div className="w-[300px] max-w-full px-4 sm:w-[400px]">
        <video
          src="/assets/loader-ring.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full"
        />
      </div>
    </div>
  );
}
