export default function Skeleton({ className = '', style = {}, ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{
        ...style,
      }}
      {...props}
    />
  )
}
