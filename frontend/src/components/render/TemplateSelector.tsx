import { Template } from '../../types/template.types';

interface TemplateSelectorProps {
  templates: Template[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const TemplateSelector = ({ templates, selectedId, onSelect }: TemplateSelectorProps) => {
  // Handle empty state
  if (templates.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600">No hay plantillas disponibles</p>
        <p className="text-sm text-gray-500 mt-2">
          Sube una plantilla primero en la galería
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 id="template-selector-label" className="text-lg font-medium text-gray-900 mb-3">
        Selecciona una plantilla
      </h3>
      
      <div 
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        role="group"
        aria-labelledby="template-selector-label"
      >
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`
              flex-shrink-0 relative rounded-lg overflow-hidden
              transition-all duration-200 min-h-[44px] min-w-[44px]
              focus:outline-none focus:ring-4 focus:ring-blue-500
              ${
                selectedId === template.id
                  ? 'ring-4 ring-blue-500 shadow-lg scale-105'
                  : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
              }
            `}
            aria-label={`Seleccionar plantilla ${template.filename}`}
            aria-pressed={selectedId === template.id}
          >
            <img
              src={template.url}
              alt={`Plantilla ${template.filename}`}
              className="w-32 h-32 object-cover"
            />
            
            {selectedId === template.id && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
