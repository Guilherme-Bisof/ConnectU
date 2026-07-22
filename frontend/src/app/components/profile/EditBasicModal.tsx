import { useRef, useState, useEffect } from "react";
import {
  FiX,
  FiUser,
  FiCamera,
  FiImage,
  FiEdit3,
  FiTrash2,
  FiMapPin,
  FiBookOpen,
  FiFileText,
  FiInfo,
  FiCheckCircle,
} from "react-icons/fi";
import { createPortal } from "react-dom";

interface EditBasicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  editName: string;
  setEditName: (val: string) => void;
  editAvatarUrl: string;
  setEditAvatarUrl: (val: string) => void;
  setAvatarFile: (file: File | null) => void;
  editBannerUrl: string;
  setEditBannerUrl: (val: string) => void;
  setBannerFile: (file: File | null) => void;
  editCourse: string;
  setEditCourse: (val: string) => void;
  editInstitution: string;
  setEditInstitution: (val: string) => void;
  editDegreeType: string;
  setEditDegreeType: (val: string) => void;
  editStartDate: string;
  setEditStartDate: (val: string) => void;
  editEndDate: string;
  setEditEndDate: (val: string) => void;
  setResumeFile: (file: File | null) => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  editLocation: string;
  setEditLocation: (val: string) => void;
  editResumeUrl?: string;
}

interface IBGECity {
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla?: string;
      };
    };
  };
}

let cachedCities: string[] = [];

const loadCities = async () => {
  if (cachedCities.length > 0) return cachedCities;
  try {
    const res = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
    );
    if (res.ok) {
      const data = await res.json();
      cachedCities = data.map(
        (m: IBGECity) =>
          `${m.nome}, ${m.microrregiao?.mesorregiao?.UF?.sigla || ""}`
      );
      cachedCities.sort((a, b) => a.localeCompare(b));
    }
  } catch (e) {
    console.error("Erro ao carregar cidades brasileiras:", e);
  }
  return cachedCities;
};

export function EditBasicProfileModal({
  isOpen,
  onClose,
  userRole,
  editName,
  setEditName,
  editAvatarUrl,
  setEditAvatarUrl,
  setAvatarFile,
  editBannerUrl,
  setEditBannerUrl,
  setBannerFile,
  editCourse,
  setEditCourse,
  editInstitution,
  setEditInstitution,
  editDegreeType,
  setEditDegreeType,
  editStartDate,
  setEditStartDate,
  editEndDate,
  setEditEndDate,
  setResumeFile,
  onSave,
  isSaving,
  editLocation,
  setEditLocation,
  editResumeUrl,
}: EditBasicProfileModalProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Estados locais para controle de autocomplete
  const [cities, setCities] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasLocalResume, setHasLocalResume] = useState(false);
  const [localResumeName, setLocalResumeName] = useState("");


  const [initialValues] = useState(() => ({
    name: editName,
    course: editCourse,
    institution: editInstitution,
    degreeType: editDegreeType,
    startDate: editStartDate,
    endDate: editEndDate,
    avatarUrl: editAvatarUrl,
    bannerUrl: editBannerUrl,
    location: editLocation,
  }));

  const wasSavingRef = useRef(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const list = await loadCities();
      setCities(list);
    };
    if (isOpen) {
      init();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isSaving) {
      wasSavingRef.current = true;
    } else if (wasSavingRef.current && !isSaving) {
      wasSavingRef.current = false;
      setSaveSuccess(true);
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  // Conversores de datas (MM/YYYY <=> YYYY-MM)
  const formatToInputMonth = (val: string) => {
    if (!val) return "";
    const parts = val.split("/");
    if (parts.length === 2) {
      const [month, year] = parts;
      if (month.length === 2 && year.length === 4) {
        return `${year}-${month}`;
      }
    }
    return "";
  };

  const formatFromInputMonth = (val: string) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length === 2) {
      const [year, month] = parts;
      return `${month}/${year}`;
    }
    return val;
  };

  const getResumeName = () => {
    if (hasLocalResume && localResumeName) {
      return localResumeName;
    }
    if (editResumeUrl) {
      const parts = editResumeUrl.split("/");
      return parts[parts.length - 1] || "Curriculo.pdf";
    }
    return "Curriculo.pdf";
  };

  // Comparação de alterações — agora usando o estado initialValues
  const hasChanges =
    editName !== initialValues.name ||
    editCourse !== initialValues.course ||
    editInstitution !== initialValues.institution ||
    editDegreeType !== initialValues.degreeType ||
    editStartDate !== initialValues.startDate ||
    editEndDate !== initialValues.endDate ||
    editAvatarUrl !== initialValues.avatarUrl ||
    editBannerUrl !== initialValues.bannerUrl ||
    editLocation !== initialValues.location ||
    hasLocalResume;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    // Validação da conclusão
    if (editStartDate && editEndDate) {
      const startParts = editStartDate.split("/");
      const endParts = editEndDate.split("/");
      if (startParts.length === 2 && endParts.length === 2) {
        const startVal = parseInt(startParts[1]) * 12 + parseInt(startParts[0]);
        const endVal = parseInt(endParts[1]) * 12 + parseInt(endParts[0]);
        if (endVal < startVal) {
          alert("A previsão de conclusão deve ser posterior à data de início.");
          return;
        }
      }
    }

    onSave(e);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditLocation(val);

    if (val.trim().length >= 3) {
      const cleanVal = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const filtered = cities.filter((city) => {
        const cleanCity = city
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return cleanCity.includes(cleanVal);
      });
      setFilteredSuggestions(filtered.slice(0, 10)); // Top 10 cidades sugeridas
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setEditLocation(suggestion);
    setShowSuggestions(false);
  };

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <style>{`
        .profile-modal-content {
          scrollbar-width: thin;
          scrollbar-color: #3f3f46 transparent;
        }
        .profile-modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .profile-modal-content::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 9999px;
        }
        .profile-modal-content::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      {/* Modal Container */}
      <div className="
        fixed inset-x-[12px] bottom-[max(12px,env(safe-area-inset-bottom))] top-[76px] z-[101]
        flex flex-col overflow-hidden rounded-[16px] border border-[#424656] bg-[#1e2024] shadow-2xl
        sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2
      ">
        <header className="shrink-0 bg-[#1e2024]/90 backdrop-blur-md px-8 py-6 border-b border-[#424656] flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-white">Editar perfil</h1>
            <p className="text-sm text-gray-400">
              Atualize suas informações principais e acadêmicas.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full hover:bg-[#282a2e] transition-colors text-gray-400 hover:text-white"
          >
            <FiX className="text-xl" />
          </button>
        </header>

        <form
          onSubmit={handleFormSubmit}
          className="profile-modal-content flex-1 overflow-y-auto px-8 pt-8 pb-8 space-y-8 min-h-0"
        >
          <input
            type="file"
            ref={avatarInputRef}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                setAvatarFile(file);
                setEditAvatarUrl(URL.createObjectURL(file));
              }
            }}
            className="hidden"
          />

          <input
            type="file"
            ref={bannerInputRef}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                setBannerFile(file);
                setEditBannerUrl(URL.createObjectURL(file));
              }
            }}
            className="hidden"
          />

          <input
            type="file"
            ref={resumeInputRef}
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                setResumeFile(file);
                setHasLocalResume(true);
                setLocalResumeName(file.name);
              }
            }}
            className="hidden"
          />

          {/*  IDENTIDADE */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#316cf4]">
              <FiUser className="text-[20px]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                Identidade
              </h2>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-[#1e2024] p-4 rounded-xl border border-[#424656]">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative group shrink-0 cursor-pointer"
              >
                <div className="rounded-full border-2 border-[#316cf4] overflow-hidden bg-[#282a2e] w-16 h-16 flex items-center justify-center">
                  {editAvatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      className="w-full h-full object-cover"
                      src={editAvatarUrl}
                      alt="Avatar Preview"
                    />
                  ) : (
                    <span className="text-white text-xl font-bold uppercase">
                      {editName ? editName.charAt(0) : "U"}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiCamera className="text-white text-lg" />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 bg-[#0066ff] text-white font-semibold text-xs rounded-lg hover:bg-blue-600 transition-colors"
                    type="button"
                  >
                    Alterar foto
                  </button>
                  {editAvatarUrl && (
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setEditAvatarUrl("");
                      }}
                      className="px-4 py-2 font-semibold text-xs text-red-400 hover:text-red-300 transition-colors"
                      type="button"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JPG, GIF ou PNG. Máx 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">
                  Nome Completo
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                  type="text"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-semibold text-gray-400">
                  Localização
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]" />
                  <input
                    value={editLocation}
                    onChange={handleLocationChange}
                    placeholder="Busque e selecione sua cidade"
                    className="w-full bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg pl-12 pr-4 py-3 text-sm text-white outline-none transition-all"
                    type="text"
                  />
                </div>

                {/* Lista de sugestões / Dropdown Autocomplete */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 mt-1 bg-[#1e2024] border border-[#424656] rounded-lg shadow-xl max-h-60 overflow-y-auto z-9999 profile-modal-content"
                  >
                    {filteredSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#316cf4]/10 hover:text-white transition-colors border-b border-[#424656]/30 last:border-b-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CAPA DO PERFIL */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-[#316cf4]">
              <FiImage className="text-[20px]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                Capa do Perfil
              </h2>
            </div>
            <div className="bg-[#1e2024] rounded-xl border border-[#424656] overflow-hidden group relative">
              <div
                className="h-32 w-full bg-[#282a2e] relative bg-cover bg-center"
                style={{
                  backgroundImage: editBannerUrl
                    ? `url(${editBannerUrl})`
                    : "none",
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="bg-[#111317]/80 backdrop-blur-md px-4 py-2 rounded-lg border border-[#424656] text-white font-semibold text-xs flex items-center gap-2 hover:bg-[#111317] transition-colors"
                    type="button"
                  >
                    <FiEdit3 className="text-sm" />
                    Alterar capa
                  </button>
                  {editBannerUrl && (
                    <button
                      onClick={() => {
                        setBannerFile(null);
                        setEditBannerUrl("");
                      }}
                      className="border border-red-500/30 bg-red-500/10 text-red-400 font-semibold text-xs flex items-center gap-2 hover:bg-red-500/20 transition-colors backdrop-blur-md px-4 py-2 rounded-lg"
                      type="button"
                    >
                      <FiTrash2 className="text-sm" />
                      Remover capa
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500">
                  Recomendado: imagem horizontal de pelo menos 1600 × 400 px.
                </p>
              </div>
            </div>
          </section>

          {/* FORMAÇÃO ACADÊMICA (Somente Alunos) */}
          {userRole === "STUDENT" && (
            <>
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-[#316cf4]">
                  <FiBookOpen className="text-[20px]" />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                    Formação Acadêmica
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">
                      Curso
                    </label>
                    <input
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      className="bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                      placeholder="Ex: Engenharia de Software"
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">
                      Instituição
                    </label>
                    <input
                      value={editInstitution}
                      onChange={(e) => setEditInstitution(e.target.value)}
                      className="bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                      placeholder="Ex: Universidade de São Paulo"
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400">
                      Nível de Formação
                    </label>
                    <div className="relative">
                      <select
                        value={editDegreeType}
                        onChange={(e) => setEditDegreeType(e.target.value)}
                        className="w-full bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg pl-4 pr-10 py-3 text-sm text-white outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Técnico">Técnico</option>
                        <option value="Tecnólogo">Tecnólogo</option>
                        <option value="Bacharelado">Bacharelado</option>
                        <option value="Licenciatura">Licenciatura</option>
                        <option value="Pós-graduação">Pós-graduação</option>
                        <option value="Mestrado">Mestrado</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-gray-400">
                      Início
                    </label>
                    <input
                      value={formatToInputMonth(editStartDate)}
                      onChange={(e) =>
                        setEditStartDate(formatFromInputMonth(e.target.value))
                      }
                      className="bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all cursor-pointer"
                      type="month"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-gray-400">
                      Conclusão
                    </label>
                    <input
                      value={formatToInputMonth(editEndDate)}
                      onChange={(e) =>
                        setEditEndDate(formatFromInputMonth(e.target.value))
                      }
                      className="bg-[#111317] border border-[#424656] focus:border-[#316cf4] focus:ring-1 focus:ring-[#316cf4] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all cursor-pointer"
                      type="month"
                    />
                  </div>
                </div>
              </section>

              {/* CURRÍCULO */}
              <section className="space-y-6 pb-20">
                <div className="flex items-center gap-2 text-[#316cf4]">
                  <FiFileText className="text-[20px]" />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                    Currículo
                  </h2>
                </div>
                {/* File state: Exists example */}
                {editEndDate || hasLocalResume ? (
                  <div className="bg-[#282a2e] border border-[#424656] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[#111317] flex items-center justify-center border border-[#424656] shrink-0">
                        <FiFileText className="text-[#316cf4] text-xl" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                          {getResumeName()}
                        </span>
                        <span className="text-xs text-gray-500">PDF</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={() => resumeInputRef.current?.click()}
                        className="text-[#316cf4] font-semibold text-xs hover:underline"
                        type="button"
                      >
                        Substituir
                      </button>
                      <button
                        onClick={() => {
                          setResumeFile(null);
                          setEditEndDate("");
                          setHasLocalResume(false);
                        }}
                        className="text-red-400 font-semibold text-xs hover:underline"
                        type="button"
                      >
                        Remover currículo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => resumeInputRef.current?.click()}
                    className="border-2 border-dashed border-[#424656] hover:border-[#316cf4] rounded-xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <FiFileText className="mx-auto mb-2 text-2xl text-gray-500" />
                    <p className="text-sm text-gray-300">
                      Selecione ou arraste seu currículo em PDF
                    </p>
                  </div>
                )}
                {/* Helper text */}
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <FiInfo className="text-xs" />
                  Somente PDF. Máx 5MB.
                </p>
              </section>
            </>
          )}
        </form>

        {/* FOOTER */}
        <footer className="shrink-0 bg-[#1e2024] px-8 py-6 pb-[max(24px,env(safe-area-inset-bottom))] border-t border-[#424656] flex items-center justify-end gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[#424656] rounded-lg text-sm text-white hover:bg-[#282a2e] transition-all active:scale-95 font-semibold"
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={(!hasChanges && !isSaving && !saveSuccess) || isSaving}
            className="px-8 py-3 bg-[#0066ff] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Salvando...
              </>
            ) : saveSuccess ? (
              <>
                <FiCheckCircle className="text-base" />
                Alterações salvas
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
        </footer>
      </div>
    </>,
    document.body
  );
}
