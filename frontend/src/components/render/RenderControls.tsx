import { RotateCcw } from 'lucide-react';
import { RenderOptions } from '../../types/render.types';

interface RenderControlsProps {
  values: RenderOptions;
  onChange: (options: Partial<RenderOptions>) => void;
  onReset: () => void;
}

export const RenderControls = ({ values, onChange, onReset }: RenderControlsProps) => {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Ajustes de renderizado
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px]"
          title="Restablecer valores predeterminados"
          aria-label="Restablecer ajustes a valores predeterminados"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Restablecer
        </button>
      </div>

      {/* Fit Mode Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Modo de ajuste
          <span
            className="ml-2 text-gray-400 cursor-help"
            title="Cover: La foto cubre toda el área (puede recortarse). Contain: La foto se ajusta completamente dentro del área."
            aria-label="Información: Cover cubre toda el área, Contain ajusta completamente"
          >
            ⓘ
          </span>
        </label>
        <div className="flex gap-4" role="group" aria-label="Seleccionar modo de ajuste">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="fit"
              value="cover"
              checked={values.fit === 'cover'}
              onChange={(e) => onChange({ fit: e.target.value as 'cover' | 'contain' })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              aria-label="Modo cover: la foto cubre toda el área"
            />
            <span className="text-sm text-gray-700">Cover (cubrir)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="fit"
              value="contain"
              checked={values.fit === 'contain'}
              onChange={(e) => onChange({ fit: e.target.value as 'cover' | 'contain' })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              aria-label="Modo contain: la foto se ajusta completamente"
            />
            <span className="text-sm text-gray-700">Contain (contener)</span>
          </label>
        </div>
      </div>

      {/* OffsetX Slider */}
      <div className="space-y-2">
        <label htmlFor="offset-x" className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>
            Desplazamiento horizontal (X)
            <span
              className="ml-2 text-gray-400 cursor-help"
              title="Ajusta la posición horizontal de la foto dentro del marco (-1.0 = izquierda, 0 = centro, 1.0 = derecha)"
              aria-label="Información: Ajusta la posición horizontal de la foto dentro del marco"
            >
              ⓘ
            </span>
          </span>
          <span className="text-blue-600 font-mono" aria-live="polite">{values.offsetX.toFixed(2)}</span>
        </label>
        <input
          id="offset-x"
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={values.offsetX}
          onChange={(e) => onChange({ offsetX: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          aria-label="Desplazamiento horizontal"
          aria-valuemin={-1}
          aria-valuemax={1}
          aria-valuenow={values.offsetX}
          aria-valuetext={`${values.offsetX.toFixed(2)}`}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>-1.0 (izquierda)</span>
          <span>0 (centro)</span>
          <span>1.0 (derecha)</span>
        </div>
      </div>

      {/* OffsetY Slider */}
      <div className="space-y-2">
        <label htmlFor="offset-y" className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>
            Desplazamiento vertical (Y)
            <span
              className="ml-2 text-gray-400 cursor-help"
              title="Ajusta la posición vertical de la foto dentro del marco (-1.0 = arriba, 0 = centro, 1.0 = abajo)"
              aria-label="Información: Ajusta la posición vertical de la foto dentro del marco"
            >
              ⓘ
            </span>
          </span>
          <span className="text-blue-600 font-mono" aria-live="polite">{values.offsetY.toFixed(2)}</span>
        </label>
        <input
          id="offset-y"
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={values.offsetY}
          onChange={(e) => onChange({ offsetY: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          aria-label="Desplazamiento vertical"
          aria-valuemin={-1}
          aria-valuemax={1}
          aria-valuenow={values.offsetY}
          aria-valuetext={`${values.offsetY.toFixed(2)}`}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>-1.0 (arriba)</span>
          <span>0 (centro)</span>
          <span>1.0 (abajo)</span>
        </div>
      </div>
    </div>
  );
};
