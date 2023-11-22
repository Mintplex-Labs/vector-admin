export default function VectorDBOption({
  name,
  link,
  description,
  value,
  image,
  checked = false,
  onClick,
}) {
  return (
    <div
      onClick={() => onClick(value)}
      style={{
        background: checked
          ? `linear-gradient(180deg, #313236 0%, rgba(63, 65, 70, 0.00) 100%)`
          : `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)`,
        borderRadius: `15px`,
        boxShadow: ` 0px 4px 30px 0px rgba(0, 0, 0, 0.20)`,
      }}
    >
      <input
        type="checkbox"
        value={value}
        className="peer hidden"
        checked={checked}
        readOnly={true}
        formNoValidate={true}
      />
      <label className="hover:text-underline peer-checked:bg-selected-preference-gradient inline-flex h-full w-60 cursor-pointer flex-col items-start justify-between rounded-2xl border-2 border-transparent px-5 py-4 text-white shadow-md transition-all duration-300 hover:border-white/60 peer-checked:border-white peer-checked:border-opacity-90">
        <div className="flex items-center">
          <img src={image} alt={name} className="h-10 w-10 rounded" />
          <div className="ml-4 text-sm font-semibold">{name}</div>
        </div>
        <div className="font-base mt-2 text-xs tracking-wide text-white">
          {description}
        </div>
        <a
          href={`https://${link}`}
          className="mt-2 text-xs font-medium text-white underline"
        >
          {link}
        </a>
      </label>
    </div>
  );
}
