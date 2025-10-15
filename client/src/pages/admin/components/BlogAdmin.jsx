import { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, Upload, Tabs, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import {
    requestCreateBlog,
    requestDeleteBlog,
    requestGetAllBlog,
    requestUpdateBlog,
    requestUploadImageBlog,
} from '../../../config/request';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { TabPane } = Tabs;

function BlogAdmin() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewBlog, setPreviewBlog] = useState(null);
    const editorRef = useRef(null);
    const [fileList, setFileList] = useState([]);

    // Fetch blogs
    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        // Giả lập API call
        const res = await requestGetAllBlog();
        setBlogs(res.metadata);
        setLoading(false);
    };

    const showAddModal = () => {
        setEditingBlog(null);
        form.resetFields();
        setIsModalVisible(true);
        setActiveTab('1');
    };

    const showEditModal = (blog) => {
        setEditingBlog(blog);
        form.setFieldsValue({
            title: blog.title,
            image: blog.image,
            content: blog.content,
        });

        // Chuẩn bị file list cho upload
        setFileList([
            {
                uid: '-1',
                name: 'image.png',
                status: 'done',
                url: import.meta.env.VITE_API_URL + blog.image,
            },
        ]);

        setIsModalVisible(true);
        setActiveTab('1');
    };

    const showPreview = (blog) => {
        setPreviewBlog(blog);
        setPreviewVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setPreviewVisible(false);
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await requestDeleteBlog({ id });
            // toast.success('Xóa bài viết thành công!');
            fetchBlogs();
        } catch (error) {
            // toast.error('Xóa bài viết thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        form.validateFields().then(async (values) => {
            setLoading(true);

            let image = editingBlog ? editingBlog.image : '';
            if (fileList[0].originFileObj) {
                const formData = new FormData();
                formData.append('image', fileList[0].originFileObj);
                image = await requestUploadImageBlog(formData);
            }

            const blogData = {
                ...values,
                image: image?.metadata || (editingBlog ? editingBlog.image : ''),
            };

            if (editingBlog) {
                const data = {
                    id: editingBlog.id,
                    ...blogData,
                };
                await requestUpdateBlog(data);
                // toast.success('Cập nhật bài viết thành công!');
            } else {
                await requestCreateBlog(blogData);
                // toast.success('Thêm bài viết mới thành công!');
            }
            fetchBlogs();
            setLoading(false);
            setIsModalVisible(false);
            setFileList([]);
        });
    };

    // Xử lý upload file
    const handleFileChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    // Xử lý trước khi upload
    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            // toast.error('Chỉ có thể tải lên file JPG/PNG!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            // toast.error('Hình ảnh phải nhỏ hơn 2MB!');
        }
        return false; // Ngăn upload tự động
    };

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div className="flex items-center">
                    <div
                        className="w-12 h-12 mr-2 bg-cover bg-center rounded"
                        style={{
                            backgroundImage: `url(${import.meta.env.VITE_API_URL}/uploads/blogs/${record.image})`,
                        }}
                    ></div>
                    <div>
                        <div className="font-medium">{text}</div>
                        <div className="text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => showPreview(record)}>
                        Xem
                    </Button>
                    <Button type="default" size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa bài viết này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            {/* <ToastContainer /> */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý bài viết</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                    Thêm bài viết mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={blogs}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                className="bg-white rounded-lg shadow"
            />

            {/* Modal thêm/sửa blog */}
            <Modal
                title={editingBlog ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
                open={isModalVisible}
                onCancel={handleCancel}
                width={1000}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
                        {editingBlog ? 'Cập nhật' : 'Thêm mới'}
                    </Button>,
                ]}
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Thông tin cơ bản" key="1">
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="title"
                                label="Tiêu đề"
                                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                            >
                                <Input placeholder="Nhập tiêu đề bài viết" />
                            </Form.Item>

                            <Form.Item
                                name="image"
                                label="Hình ảnh"
                                rules={[{ required: true, message: 'Vui lòng tải lên hình ảnh!' }]}
                            >
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    beforeUpload={beforeUpload}
                                    onChange={handleFileChange}
                                    maxCount={1}
                                >
                                    {fileList.length >= 1 ? null : (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>Tải lên</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>

                            <Form.Item name="content" label="Nội dung">
                                <ReactQuill theme="snow" style={{ height: 300, marginBottom: 30 }} />
                            </Form.Item>
                        </Form>
                    </TabPane>
                </Tabs>
            </Modal>

            {/* Modal xem trước blog */}
            <Modal
                title="Xem trước bài viết"
                open={previewVisible}
                onCancel={handleCancel}
                width={800}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Đóng
                    </Button>,
                    previewBlog && (
                        <Button
                            key="edit"
                            type="primary"
                            onClick={() => {
                                handleCancel();
                                showEditModal(previewBlog);
                            }}
                        >
                            Chỉnh sửa
                        </Button>
                    ),
                ]}
            >
                {previewBlog && (
                    <div className="preview-blog">
                        <h1 className="text-2xl font-bold mb-4">{previewBlog.title}</h1>
                        <div className="mb-4">
                            <img
                                src={`${import.meta.env.VITE_API_URL}/uploads/blogs/${previewBlog.image}`}
                                alt={previewBlog.title}
                                className="w-full h-auto rounded-lg"
                            />
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mb-4">
                            <div className="mr-4">
                                <strong>Ngày tạo:</strong> {new Date(previewBlog.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                            <div>
                                <strong>Cập nhật:</strong> {new Date(previewBlog.updatedAt).toLocaleDateString('vi-VN')}
                            </div>
                        </div>

                        <div className="mb-4">
                            <strong className="block mb-2">Nội dung:</strong>
                            <div dangerouslySetInnerHTML={{ __html: previewBlog.content }}></div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default BlogAdmin;
