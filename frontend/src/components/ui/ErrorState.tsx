export function ErrorState({ message }: { message: string }) {
  return (
    <p className="m-6 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
      エラーが発生しました: {message}
    </p>
  );
}
