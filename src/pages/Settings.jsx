import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { API_BASE_URL } from "../config/api.js";
import { fetchJson, updateData } from "../utils/api.js";
import { useCustomDialog } from "../utils/dialog.js";
import { showToast } from "../utils/toast.js";
import "./Settings.css";

export default function Settings() {
  const { showConfirm } = useCustomDialog();
  const [activeTab, setActiveTab] = useState("imageTypes");

  const [imageTypes, setImageTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [imageTypeForm, setImageTypeForm] = useState({ key: "", label: "", description: "", sort_order: 0 });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", color: "#C84B31", sort_order: 0 });

  const [editingImageType, setEditingImageType] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const [isCreatingImageType, setIsCreatingImageType] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const imageTypeKeyRef = useRef(null);
  const imageTypeLabelRef = useRef(null);
  const categoryNameRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, catsRes] = await Promise.all([
        fetchJson(`${API_BASE_URL}/settings/image-types/all`),
        fetchJson(`${API_BASE_URL}/settings/categories/all`),
      ]);
      if (typesRes.success) setImageTypes(typesRes.data);
      if (catsRes.success) setCategories(catsRes.data);
    } catch (err) {
      showToast("加载数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageTypeSubmit = async (e) => {
    e.preventDefault();
    if (!imageTypeForm.key.trim() || !imageTypeForm.label.trim()) {
      showToast("请填写标识和名称", "error");
      return;
    }
    try {
      if (editingImageType) {
        await updateData(`${API_BASE_URL}/settings/image-types/${editingImageType.id}`, {
          label: imageTypeForm.label,
          description: imageTypeForm.description,
          sort_order: parseInt(imageTypeForm.sort_order) || 0,
        });
        showToast("图片类型更新成功");
      } else {
        await updateData(`${API_BASE_URL}/settings/image-types`, imageTypeForm, "POST");
        showToast("图片类型创建成功");
      }
      setImageTypeForm({ key: "", label: "", description: "", sort_order: 0 });
      setEditingImageType(null);
      setIsCreatingImageType(false);
      loadData();
    } catch (err) {
      showToast(err.message || "操作失败", "error");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast("请填写分类名称", "error");
      return;
    }
    try {
      if (editingCategory) {
        await updateData(`${API_BASE_URL}/settings/categories/${editingCategory.id}`, {
          name: categoryForm.name,
          description: categoryForm.description,
          color: categoryForm.color,
          sort_order: parseInt(categoryForm.sort_order) || 0,
        });
        showToast("分类更新成功");
      } else {
        await updateData(`${API_BASE_URL}/settings/categories`, categoryForm, "POST");
        showToast("分类创建成功");
      }
      setCategoryForm({ name: "", description: "", color: "#C84B31", sort_order: 0 });
      setEditingCategory(null);
      setIsCreatingCategory(false);
      loadData();
    } catch (err) {
      showToast(err.message || "操作失败", "error");
    }
  };

  const toggleImageTypeActive = async (id, isActive) => {
    try {
      await updateData(`${API_BASE_URL}/settings/image-types/${id}`, {
        is_active: !isActive,
      });
      showToast(!isActive ? "已启用" : "已禁用");
      loadData();
    } catch (err) {
      showToast("操作失败", "error");
    }
  };

  const toggleCategoryActive = async (id, isActive) => {
    try {
      await updateData(`${API_BASE_URL}/settings/categories/${id}`, {
        is_active: !isActive,
      });
      showToast(!isActive ? "已启用" : "已禁用");
      loadData();
    } catch (err) {
      showToast("操作失败", "error");
    }
  };

  const deleteImageType = async (id) => {
    const confirmed = await showConfirm("确认删除", "确定要删除这个图片类型吗？删除后将无法恢复。");
    if (!confirmed) return;
    try {
      await updateData(`${API_BASE_URL}/settings/image-types/${id}`, null, "DELETE");
      showToast("删除成功");
      loadData();
    } catch (err) {
      showToast(err.message || "删除失败", "error");
    }
  };

  const deleteCategory = async (id) => {
    const confirmed = await showConfirm("确认删除", "确定要删除这个分类吗？删除后将无法恢复。");
    if (!confirmed) return;
    try {
      await updateData(`${API_BASE_URL}/settings/categories/${id}`, null, "DELETE");
      showToast("删除成功");
      loadData();
    } catch (err) {
      showToast(err.message || "删除失败", "error");
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(activeTab === "imageTypes" ? imageTypes : categories);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    const updated = items.map((item, index) => ({ ...item, sort_order: index }));
    if (activeTab === "imageTypes") {
      setImageTypes(updated);
    } else {
      setCategories(updated);
    }

    try {
      await Promise.all(
        updated.map((item) =>
          updateData(
            `${API_BASE_URL}/settings/${activeTab === "imageTypes" ? "image-types" : "categories"}/${item.id}`,
            { sort_order: item.sort_order }
          )
        )
      );
    } catch {
      showToast("保存排序失败", "error");
      loadData();
    }
  };

  const startCreateImageType = () => {
    setEditingImageType(null);
    setImageTypeForm({ key: "", label: "", description: "", sort_order: 0 });
    setIsCreatingImageType(true);
    setTimeout(() => imageTypeKeyRef.current?.focus(), 100);
  };

  const startCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "", color: "#C84B31", sort_order: 0 });
    setIsCreatingCategory(true);
    setTimeout(() => categoryNameRef.current?.focus(), 100);
  };

  const startEditImageType = (type) => {
    setEditingImageType(type);
    setImageTypeForm({
      key: type.key,
      label: type.label,
      description: type.description || "",
      sort_order: type.sort_order || 0,
    });
    setIsCreatingImageType(true);
    setTimeout(() => imageTypeLabelRef.current?.focus(), 100);
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || "",
      color: cat.color || "#C84B31",
      sort_order: cat.sort_order || 0,
    });
    setIsCreatingCategory(true);
    setTimeout(() => categoryNameRef.current?.focus(), 100);
  };

  const cancelImageTypeForm = () => {
    setIsCreatingImageType(false);
    setEditingImageType(null);
    setImageTypeForm({ key: "", label: "", description: "", sort_order: 0 });
  };

  const cancelCategoryForm = () => {
    setIsCreatingCategory(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "", color: "#C84B31", sort_order: 0 });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">设置</h1>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === "imageTypes" ? "active" : ""}`}
          onClick={() => setActiveTab("imageTypes")}
        >
          图片类型
        </button>
        <button
          className={`settings-tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          物品分类
        </button>
      </div>

      <div className="settings-content">
        {activeTab === "imageTypes" && (
          <div className="settings-section">
            <div className="settings-section-header">
              <h2 className="settings-section-title">图片类型管理</h2>
              {!isCreatingImageType && (
                <button className="btn btn-primary btn-sm" onClick={startCreateImageType}>
                  + 新增图片类型
                </button>
              )}
            </div>

            {isCreatingImageType && (
              <form className="settings-form" onSubmit={handleImageTypeSubmit}>
                <div className="settings-form-row">
                  <div className="settings-form-field">
                    <label className="settings-form-label">
                      标识 <span className="required">*</span>
                    </label>
                    <input
                      ref={imageTypeKeyRef}
                      type="text"
                      className="settings-form-input"
                      value={imageTypeForm.key}
                      onChange={(e) => setImageTypeForm({ ...imageTypeForm, key: e.target.value })}
                      placeholder="如: product_image"
                      disabled={!!editingImageType}
                      required
                    />
                  </div>
                  <div className="settings-form-field">
                    <label className="settings-form-label">
                      名称 <span className="required">*</span>
                    </label>
                    <input
                      ref={imageTypeLabelRef}
                      type="text"
                      className="settings-form-input"
                      value={imageTypeForm.label}
                      onChange={(e) => setImageTypeForm({ ...imageTypeForm, label: e.target.value })}
                      placeholder="如: 商品照片"
                      required
                    />
                  </div>
                  <div className="settings-form-field">
                    <label className="settings-form-label">排序</label>
                    <input
                      type="number"
                      className="settings-form-input"
                      value={imageTypeForm.sort_order}
                      onChange={(e) => setImageTypeForm({ ...imageTypeForm, sort_order: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="settings-form-field">
                  <label className="settings-form-label">描述</label>
                  <input
                    type="text"
                    className="settings-form-input"
                    value={imageTypeForm.description}
                    onChange={(e) => setImageTypeForm({ ...imageTypeForm, description: e.target.value })}
                    placeholder="可选描述"
                  />
                </div>
                <div className="settings-form-actions">
                  <button type="submit" className="btn btn-primary btn-sm">
                    {editingImageType ? "保存修改" : "创建"}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={cancelImageTypeForm}>
                    取消
                  </button>
                </div>
              </form>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="imageTypes">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="settings-list">
                    {imageTypes.map((type, index) => (
                      <Draggable key={type.id} draggableId={String(type.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`settings-list-item ${snapshot.isDragging ? "dragging" : ""} ${!type.is_active ? "inactive" : ""}`}
                            style={provided.draggableProps.style}
                          >
                            <div className="settings-item-drag">⋮⋮</div>
                            <div className="settings-item-content">
                              <div className="settings-item-main">
                                <span className="settings-item-name">{type.label}</span>
                                <code className="settings-item-key">{type.key}</code>
                                {type.description && (
                                  <span className="settings-item-desc">{type.description}</span>
                                )}
                              </div>
                              <div className="settings-item-meta">
                                <span className={`settings-item-status ${type.is_active ? "active" : "inactive"}`}>
                                  {type.is_active ? "启用" : "禁用"}
                                </span>
                              </div>
                            </div>
                            <div className="settings-item-actions">
                              <button
                                className="settings-item-btn"
                                onClick={() => toggleImageTypeActive(type.id, type.is_active)}
                                title={type.is_active ? "禁用" : "启用"}
                              >
                                {type.is_active ? "🚫" : "✅"}
                              </button>
                              <button
                                className="settings-item-btn"
                                onClick={() => startEditImageType(type)}
                                title="编辑"
                              >
                                ✏️
                              </button>
                              <button
                                className="settings-item-btn delete"
                                onClick={() => deleteImageType(type.id)}
                                title="删除"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="settings-section">
            <div className="settings-section-header">
              <h2 className="settings-section-title">物品分类管理</h2>
              {!isCreatingCategory && (
                <button className="btn btn-primary btn-sm" onClick={startCreateCategory}>
                  + 新增分类
                </button>
              )}
            </div>

            {isCreatingCategory && (
              <form className="settings-form" onSubmit={handleCategorySubmit}>
                <div className="settings-form-row">
                  <div className="settings-form-field">
                    <label className="settings-form-label">
                      名称 <span className="required">*</span>
                    </label>
                    <input
                      ref={categoryNameRef}
                      type="text"
                      className="settings-form-input"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="如: 电子产品"
                      required
                    />
                  </div>
                  <div className="settings-form-field">
                    <label className="settings-form-label">颜色</label>
                    <div className="settings-color-field">
                      <input
                        type="color"
                        className="settings-color-picker"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="settings-form-input"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        placeholder="#C84B31"
                      />
                    </div>
                  </div>
                  <div className="settings-form-field">
                    <label className="settings-form-label">排序</label>
                    <input
                      type="number"
                      className="settings-form-input"
                      value={categoryForm.sort_order}
                      onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="settings-form-field">
                  <label className="settings-form-label">描述</label>
                  <input
                    type="text"
                    className="settings-form-input"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="可选描述"
                  />
                </div>
                <div className="settings-form-actions">
                  <button type="submit" className="btn btn-primary btn-sm">
                    {editingCategory ? "保存修改" : "创建"}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={cancelCategoryForm}>
                    取消
                  </button>
                </div>
              </form>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="settings-list">
                    {categories.map((cat, index) => (
                      <Draggable key={cat.id} draggableId={String(cat.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`settings-list-item ${snapshot.isDragging ? "dragging" : ""} ${!cat.is_active ? "inactive" : ""}`}
                            style={provided.draggableProps.style}
                          >
                            <div className="settings-item-drag">⋮⋮</div>
                            <div className="settings-item-content">
                              <div className="settings-item-main">
                                <span
                                  className="settings-item-color"
                                  style={{ backgroundColor: cat.color || "#C84B31" }}
                                />
                                <span className="settings-item-name">{cat.name}</span>
                                {cat.description && (
                                  <span className="settings-item-desc">{cat.description}</span>
                                )}
                              </div>
                              <div className="settings-item-meta">
                                <span className={`settings-item-status ${cat.is_active ? "active" : "inactive"}`}>
                                  {cat.is_active ? "启用" : "禁用"}
                                </span>
                              </div>
                            </div>
                            <div className="settings-item-actions">
                              <button
                                className="settings-item-btn"
                                onClick={() => toggleCategoryActive(cat.id, cat.is_active)}
                                title={cat.is_active ? "禁用" : "启用"}
                              >
                                {cat.is_active ? "🚫" : "✅"}
                              </button>
                              <button
                                className="settings-item-btn"
                                onClick={() => startEditCategory(cat)}
                                title="编辑"
                              >
                                ✏️
                              </button>
                              <button
                                className="settings-item-btn delete"
                                onClick={() => deleteCategory(cat.id)}
                                title="删除"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>
    </div>
  );
}

