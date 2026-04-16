import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, MessageCircle, BookOpen, User, Hash, ChevronRight, Send, AlertCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface Topic {
  id: number;
  title: string;
  content: string;
  category: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface Comment {
  id: number;
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function Forum() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [topicForm, setTopicForm] = useState({ title: '', content: '', category: 'educacao' });
  const [activeTab, setActiveTab] = useState<'topics' | 'education'>('topics');
  const [loading, setLoading] = useState(true);
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [inlineComment, setInlineComment] = useState('');
  const [visibleComments, setVisibleComments] = useState<Record<number, Comment[]>>({});
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  // Obter usuário logado do localStorage
  const savedUser = localStorage.getItem('ph_user');
  const user: UserInfo | null = savedUser ? JSON.parse(savedUser) : null;
  const isAdminOrDoctor = user?.role === 'admin' || user?.role === 'doctor';

  useEffect(() => {
    fetchTopics();
  }, [activeTab]);

  useEffect(() => {
    if (selectedTopic) {
      fetchComments(selectedTopic.id);
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  }, [selectedTopic]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const category = activeTab === 'education' ? 'educacao' : undefined;
      const response = await api.get<Topic[]>('/topics', { params: { category } });
      setTopics(response);
    } catch (error) {
      console.error('Erro ao buscar tópicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (topicId: number) => {
    try {
      const response = await api.get<Comment[]>(`/topics/${topicId}/comments`);
      setComments(response);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/topics', {
        ...topicForm,
        created_by: user?.id
      });
      setShowNewTopicModal(false);
      setTopicForm({ title: '', content: '', category: 'educacao' });
      fetchTopics();
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTopic) return;
    
    try {
      await api.post(`/topics/${selectedTopic.id}/comments`, {
        content: newComment,
        is_anonymous: true, // Sempre anônimo como solicitado
        user_id: user?.id
      });
      setNewComment('');
      fetchComments(selectedTopic.id);
    } catch (error) {
      console.error('Erro ao postar comentário:', error);
    }
  };

  const handlePostInlineComment = async (topicId: number) => {
    if (!inlineComment.trim()) return;
    
    try {
      await api.post(`/topics/${topicId}/comments`, {
        content: inlineComment,
        is_anonymous: true,
        user_id: user?.id
      });
      setInlineComment('');
      setCommentingOn(null);
      alert('Feedback enviado com sucesso!');
      fetchTopics();
    } catch (error) {
      console.error('Erro ao postar comentário inline:', error);
    }
  };

  const toggleComments = async (topicId: number) => {
    if (visibleComments[topicId]) {
      const newVisible = { ...visibleComments };
      delete newVisible[topicId];
      setVisibleComments(newVisible);
    } else {
      try {
        const response = await api.get<Comment[]>(`/topics/${topicId}/comments`);
        setVisibleComments(prev => ({ ...prev, [topicId]: response }));
      } catch (error) {
        console.error('Erro ao buscar comentários inline:', error);
      }
    }
  };

  const handleLike = async (topicId: number) => {
    if (!user) return;
    try {
      await api.post(`/topics/${topicId}/like`, { user_id: user.id });
      // Atualizar lista localmente para feedback imediato
      setTopics(prev => prev.map(t => {
        if (t.id === topicId) {
          // Nota: Esta lógica é simplificada, o ideal seria o backend retornar o novo count
          return { ...t, likes_count: (t.likes_count || 0) + 1 };
        }
        return t;
      }));
      // Recarregar do servidor para garantir precisão
      fetchTopics();
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  const handleShare = (topic: Topic) => {
    const text = `Confira este tópico no Cesaltina: ${topic.title}`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: topic.title,
        text: text,
        url: url,
      }).catch(console.error);
    } else {
      // Fallback: copiar para área de transferência
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FC]">
      {/* Header do Fórum */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comunidade & Educação</h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'topics' 
                ? 'Participe das discussões e dê seu feedback anonimamente.' 
                : 'Aprenda sobre saúde preventiva e câncer de mama.'}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdminOrDoctor && activeTab === 'topics' && (
              <button
                onClick={() => setShowNewTopicModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Novo Tópico
              </button>
            )}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-8 border-b border-gray-100">
          <button
            onClick={() => { setActiveTab('topics'); setSelectedTopic(null); }}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'topics' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle size={18} />
            Fórum de Discussão
            {activeTab === 'topics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
          <button
            onClick={() => { setActiveTab('education'); setSelectedTopic(null); }}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'education' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={18} />
            Espaço Educativo
            {activeTab === 'education' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Tópicos */}
        <div className={`flex-1 overflow-y-auto p-8 ${selectedTopic ? 'hidden lg:block' : ''}`}>
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : topics.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash size={24} className="text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg">Nenhum tópico encontrado</h3>
                <p className="text-gray-500">Seja o primeiro a iniciar uma conversa.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className="flex flex-col items-start bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded">
                        {topic.category}
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-400 text-xs">Postado por {topic.author_name}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{topic.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{topic.content}</p>
                    <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-4 text-gray-400 text-xs">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setCommentingOn(commentingOn === topic.id ? null : topic.id); 
                            setInlineComment('');
                          }}
                          className={`flex items-center gap-1.5 font-bold transition-colors ${
                            commentingOn === topic.id ? 'text-pink-600' : 'text-blue-600 hover:underline'
                          }`}
                        >
                          <MessageCircle size={14} />
                          {commentingOn === topic.id ? 'Cancelar' : 'Comentar'}
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            toggleComments(topic.id);
                          }}
                          className={`flex items-center gap-1.5 font-bold transition-colors ${
                            visibleComments[topic.id] ? 'text-gray-900' : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          <MessageCircle size={14} />
                          {topic.comments_count || 0} {visibleComments[topic.id] ? 'Ocultar' : 'Feedbacks'}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLike(topic.id); }}
                          className="flex items-center gap-1.5 text-pink-500 hover:bg-pink-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <svg size={16} fill={topic.likes_count > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-xs font-bold">{topic.likes_count || 0}</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleShare(topic); }}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <svg size={16} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>

                    {/* Input Inline de Comentário */}
                    {commentingOn === topic.id && (
                      <div className="w-full mt-4 pt-4 border-t border-dashed border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={inlineComment}
                            onChange={(e) => setInlineComment(e.target.value)}
                            placeholder="Escreva seu feedback anônimo aqui..."
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePostInlineComment(topic.id);
                            }}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePostInlineComment(topic.id); }}
                            disabled={!inlineComment.trim()}
                            className="bg-pink-500 text-white p-2 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          Pressione Enter para enviar seu feedback anônimo.
                        </p>
                      </div>
                    )}

                    {/* Lista de Comentários Inline */}
                    {visibleComments[topic.id] && (
                      <div className="w-full mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in duration-300">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Comentários Anónimos</h4>
                        {visibleComments[topic.id].length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Ainda não há feedbacks para este tópico.</p>
                        ) : (
                          visibleComments[topic.id].map((c) => (
                            <div key={c.id} className="flex gap-3 items-start bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User size={12} className="text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-bold text-gray-900">Utilizador Anónimo</span>
                                  <span className="text-[9px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Seção Educativa Permanente sobre Câncer de Mama se estiver na aba certa */}
            {activeTab === 'education' && (
              <div className="mt-12 bg-pink-50 rounded-2xl p-8 border border-pink-100">
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <AlertCircle size={32} className="text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-pink-900 mb-2">O que você precisa saber sobre o Câncer de Mama</h2>
                    <p className="text-pink-800 text-sm leading-relaxed mb-4">
                      O câncer de mama é o tipo de câncer que mais acomete as mulheres em todo o mundo. 
                      O diagnóstico precoce é o segredo para o sucesso do tratamento, com taxas de cura chegando a 95%.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white/50 p-4 rounded-xl border border-pink-200/50">
                        <h4 className="font-bold text-pink-900 text-xs uppercase mb-2">Principais Sintomas</h4>
                        <ul className="text-xs text-pink-800 space-y-1">
                          <li>• Nódulo (caroço) endurecido e indolor</li>
                          <li>• Pele da mama avermelhada ou retraída</li>
                          <li>• Alterações no mamilo</li>
                          <li>• Saída espontânea de líquido dos mamilos</li>
                        </ul>
                      </div>
                      <div className="bg-white/50 p-4 rounded-xl border border-pink-200/50">
                        <h4 className="font-bold text-pink-900 text-xs uppercase mb-2">Prevenção</h4>
                        <ul className="text-xs text-pink-800 space-y-1">
                          <li>• Praticar exercícios físicos</li>
                          <li>• Alimentação saudável</li>
                          <li>• Evitar excesso de álcool</li>
                          <li>• Amamentação (fator protetor)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do Tópico e Comentários */}
        {selectedTopic && (
          <div className="w-full lg:w-[450px] border-l border-gray-200 bg-white flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <button 
                onClick={() => setSelectedTopic(null)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                Voltar
              </button>
              <h2 className="font-bold text-gray-900 truncate flex-1">Detalhes da Discussão</h2>
              <Hash size={18} className="text-gray-400 ml-4" />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-8">
                <div className="text-[10px] font-bold text-blue-600 uppercase mb-2">{selectedTopic.category}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedTopic.title}</h3>
                <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-700 leading-relaxed">
                  {selectedTopic.content}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] text-blue-600 font-bold">
                      {selectedTopic.author_name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-500">Postado por {selectedTopic.author_name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(selectedTopic.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle size={16} />
                  Feedback da Comunidade
                </h4>
                
                {comments.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                    <p className="text-xs text-gray-400">Nenhum feedback anônimo ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-gray-400" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-2xl p-4 overflow-hidden">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Anônimo</span>
                            <span className="text-[9px] text-gray-400">{new Date(comment.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input de Comentário */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva seu feedback anônimo aqui..."
                  className="flex-1 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-blue-300"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Sua identidade será protegida. Comentários são 100% anônimos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo Tópico */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Painel de Controle</span>
                <button onClick={() => setShowNewTopicModal(false)} className="text-gray-400 hover:text-gray-600">
                  <Trash2 size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Novo Tópico</h2>
              <p className="text-gray-500 text-xs">Crie conteúdos educativos ou inicie discussões.</p>
            </div>
            
            <form onSubmit={handleCreateTopic} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Título do Tópico</label>
                <input
                  type="text"
                  required
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  placeholder="Ex: Autoexame: Como realizar?"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoria</label>
                <div className="flex gap-3">
                  {['educacao', 'discussao', 'alerta'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTopicForm({ ...topicForm, category: cat })}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
                        topicForm.category === cat 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Conteúdo Detalhado</label>
                <textarea
                  required
                  rows={4}
                  value={topicForm.content}
                  onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
                  placeholder="Escreva aqui as informações ou perguntas..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Publicar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
