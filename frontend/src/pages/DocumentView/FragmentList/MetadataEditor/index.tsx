import { memo, useState } from 'react';
import { AlertTriangle, PlusCircle, Trash, X } from 'react-feather';
import { castToType, constructModifiedMetadata } from './utils';
import Document from '../../../../models/document';
import showToast from '../../../../utils/toast';

const MetadataEditor = memo(
  ({
    data,
    fragment,
    connector,
    canEdit,
  }: {
    data: any;
    fragment: any;
    connector: any;
    canEdit: boolean;
  }) => {
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>('');
    const { text: _, vectorId: __, ...metadata } = data?.metadata;
    const [editableMetadata, setEditableMetadata] = useState({ ...metadata });
    const addNewKeyValue = (
      key: string,
      value: string | number | boolean,
      type: 'string' | 'number' | 'boolean' = 'string'
    ) => {
      editableMetadata[key] = castToType(type, value);
      setEditableMetadata({ ...editableMetadata });
      setHasChanges(true);
    };

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setSaving(true);
      setError('');
      const data = constructModifiedMetadata(e.target);
      const { success, error } = await Document.updateFragmentMetadata(
        fragment.id,
        data
      );
      setSaving(false);

      if (!success && !!error) {
        setError(error);
        return;
      }

      showToast(
        'Updating metadata for embedding in background job.',
        'success',
        { clear: true }
      );
      document.getElementById(`${fragment.id}-metadata-editor`)?.close();
      setHasChanges(false);
      return;
    };

    return (
      <>
        <dialog
          id={`${fragment.id}-metadata-editor`}
          className="w-1/2 rounded-lg"
        >
          <div className="my-4 flex w-full flex-col gap-y-1 px-[20px]">
            <p className="text-lg font-semibold text-blue-600">
              Edit metadata for embedding
            </p>
            <p className="text-sm text-slate-800">
              Listed below is all of the current metadata keys and values. You
              can delete or create new key-value pairs. Metadata is useful if
              your application of vector data requires filtering based on
              non-embedded information.
            </p>

            {connector.type === 'weaviate' && (
              <div className="flex w-full items-center justify-center gap-x-2 rounded-lg border border-orange-600 bg-orange-50 px-4 py-2 text-lg text-orange-800">
                <AlertTriangle size={18} />
                <p>
                  Deletion of metadata keys is disabled for Weaviate databases.
                </p>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col overflow-y-scroll px-[20px] py-0">
            {!!error && (
              <p className="mb-4 w-full rounded-lg bg-red-200 px-4 py-2 text-lg text-red-600">
                {error}
              </p>
            )}
            <JSONFormBuilder
              fragment={fragment}
              onSubmit={handleSubmit}
              onChange={setHasChanges}
              metadata={editableMetadata}
              canEdit={canEdit}
              canDelete={connector.type !== 'weaviate'}
            />
            <NewEntry addKeyPair={addNewKeyValue} />

            <div className="mt-4 flex flex-col gap-y-2">
              <div hidden={!hasChanges || !canEdit}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    document
                      .getElementById(`${fragment.id}-submit-metadata`)
                      ?.click()
                  }
                  className="flex w-full justify-center rounded border border-blue-100 bg-blue-50 bg-transparent p-3 font-medium text-blue-500 hover:bg-blue-600 hover:text-white"
                >
                  {saving ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById(`${fragment.id}-metadata-editor`)
                    ?.close();
                }}
                className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      </>
    );
  }
);

function JSONFormBuilder({
  fragment,
  onSubmit,
  onChange,
  metadata,
  canDelete,
  canEdit,
}: {
  fragment: { id: number };
  onSubmit: any;
  onChange: (b: boolean) => void;
  metadata: object;
  canDelete: boolean;
  canEdit: boolean;
}) {
  const renderField = (
    key: string,
    value: string | number | boolean,
    name: string
  ) => {
    const containerId = `${name ? `${name}.${key}` : key}-container`;
    const setKeyForRemoval = () => {
      if (!canDelete) return;
      document.getElementById(containerId)?.setAttribute('hidden', 'true');
      document
        .getElementById(containerId)
        ?.querySelector('input')
        ?.setAttribute('disabled', 'true');
      onChange(true);
    };

    return (
      <div key={key} id={containerId} className="mb-4">
        <label className="mb-2 flex items-center gap-x-1 text-sm text-gray-700">
          <p className="font-bold">{key}</p>
          <i className="font-regular text-xs text-gray-600">
            ({value === null ? 'string' : typeof value})
          </i>
        </label>
        <div className="flex w-full items-center gap-x-2">
          <input
            disabled={!canEdit}
            className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
            name={name ? `${name}.${key}` : key}
            type={typeof value === 'number' ? 'number' : 'text'}
            data-output-type={value === null ? 'string' : typeof value}
            defaultValue={
              typeof value === 'number' ? Number(value) : String(value ?? '')
            }
          />
          {canDelete && (
            <button
              type="button"
              onClick={setKeyForRemoval}
              className="group rounded-full p-1 hover:bg-red-100"
            >
              <Trash
                className="text-gray-300 group-hover:text-red-600"
                size={20}
              />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderObject = (obj = {}, parentKey = '', name = '') => {
    if (!obj) return null;
    return (
      <fieldset key={parentKey} className="mb-4 rounded border p-4">
        <legend className="mb-2 text-sm font-bold text-gray-800">
          {parentKey}
        </legend>
        {Object.entries(obj).map(([key, value]) =>
          typeof value === 'object' && value !== null
            ? renderObject(value, key, `${name ? `${name}.` : ''}${key}`)
            : renderField(key, value, name)
        )}
      </fieldset>
    );
  };

  return (
    <form
      id={`${fragment.id}-metadata`}
      onSubmit={onSubmit}
      className="w-full"
      onChange={() => onChange(true)}
    >
      {renderObject(metadata)}
      <button
        type="submit"
        className="hidden"
        form={`${fragment.id}-metadata`}
        id={`${fragment.id}-submit-metadata`}
      />
    </form>
  );
}

const NewEntry = ({
  addKeyPair,
}: {
  addKeyPair: (
    key: string,
    value: string | boolean | number,
    type: 'string' | 'boolean' | 'number'
  ) => void;
}) => {
  const [showing, setShowing] = useState(false);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    const form = new FormData(e.target);
    addKeyPair(
      form.get('metadata_key'),
      form.get('metadata_value'),
      form.get('metadata_value_type')
    );
    e.target.reset();
    return;
  };

  return (
    <>
      <div hidden={showing}>
        <button
          type="button"
          onClick={() => setShowing(true)}
          className="flex w-full items-center  justify-center gap-x-2 rounded bg-transparent p-3 font-medium text-blue-500 hover:bg-blue-600 hover:text-white"
        >
          <PlusCircle size={18} />
          Add new metadata item
        </button>
      </div>

      <div hidden={!showing}>
        <form
          onSubmit={handleSubmit}
          id="newMetadata"
          className="flex w-full flex-col gap-y-2 rounded-lg border border-gray-200 px-6 py-4"
        >
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-gray-700">
              Enter the information below to add a new metadata item to this
              embedding.
            </p>
            <button
              onClick={() => setShowing(false)}
              type="button"
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 hover:text-red-500"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-x-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Metadata key
              </label>
              <input
                pattern="[a-zA-Z0-9]*"
                type="text"
                name="metadata_key"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                placeholder="MyKey"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Value data type
              </label>
              <select
                name="metadata_value_type"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Value
              </label>
              <input
                type="text"
                name="metadata_value"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                placeholder="My Special Value"
                required
              />
            </div>

            <div className="flex flex-col items-end pt-6">
              <button
                type="submit"
                form="newMetadata"
                className="flex w-fit items-center justify-center gap-x-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-600 hover:text-white"
              >
                <PlusCircle size={18} />
                <p>Add</p>
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default MetadataEditor;
