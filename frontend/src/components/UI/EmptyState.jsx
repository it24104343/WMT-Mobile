const EmptyState = ({ title, description, action }) => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-900 dark:text-white font-medium mb-2">{title}</p>
      {description && <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
};

export default EmptyState;
