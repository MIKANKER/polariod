import { Loader2 } from 'lucide-react';
import { AppLayout } from '../components/layout';
import { useRender } from '../hooks/useRender';
import { useTemplates } from '../hooks/useTemplates';
import { PhotoUploadZone } from '../components/render/PhotoUploadZone';
import { TemplateSelector } from '../components/render/TemplateSelector';
import { RenderControls } from '../components/render/RenderControls';
import { RenderPreview } from '../components/render/RenderPreview';

export const RenderPage = () => {
  const {
    template,
    options,
    result,
    setPhoto,
    setTemplate,
    setOptions,
    resetOptions,
    render,
    isLoading,
    error,
    canRender,
  } = useRender();

  const { templates, isLoading: templatesLoading } = useTemplates();

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Generar marco Polaroid
        </h1>
        <p className="mt-2 text-gray-600">
          Selecciona una foto y una plantilla para crear tu marco personalizado
        </p>
      </div>

      {/* Responsive Layout: Stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload and Controls */}
        <div className="space-y-8">
          {/* Photo Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Selecciona tu foto
            </h2>
            <PhotoUploadZone
              onPhotoSelected={setPhoto}
            />
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Elige una plantilla
            </h2>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <TemplateSelector
                templates={templates}
                selectedId={template}
                onSelect={setTemplate}
              />
            )}
          </div>

          {/* Render Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Ajusta la posición
            </h2>
            <RenderControls
              values={options}
              onChange={setOptions}
              onReset={resetOptions}
            />
          </div>

          {/* Render Button */}
          <button
            onClick={render}
            disabled={!canRender || isLoading}
            className={`
              w-full py-4 px-6 rounded-lg font-semibold text-lg
              transition-all duration-200 min-h-[56px]
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                canRender && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            aria-label={isLoading ? 'Generando marco, por favor espera' : 'Generar marco Polaroid'}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Generando marco...
              </span>
            ) : (
              'Generar marco'
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4" role="alert">
              <p className="text-red-700 font-medium">Error al generar marco</p>
              <p className="text-red-600 text-sm mt-1">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="bg-white rounded-lg shadow-md p-6">
            {result ? (
              <RenderPreview result={result} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-label="Esperando resultado del renderizado">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Vista previa
                </h3>
                <p className="text-gray-600 text-sm">
                  El resultado aparecerá aquí después de generar el marco
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
