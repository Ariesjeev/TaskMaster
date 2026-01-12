namespace API.DTOs
{
    public class CommentDto
    {


        public class CreateCommentDto
        {
            public string Content { get; set; } = string.Empty;
        }

        public class UpdateCommentDto
        {
            public string Content { get; set; } = string.Empty;
        }

        public class CommentResponseDto
        {
            public string Id { get; set; } = string.Empty;
            public string Content { get; set; } = string.Empty;
            public string CreatedBy { get; set; } = string.Empty;
            public string CreatedByName { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public DateTime? UpdatedAt { get; set; }
            public bool CanEdit { get; set; } // To indicate if current user can edit this comment
            public bool CanDelete { get; set; } // To indicate if current user can delete this comment
        }

    }
}


//// 2. Comment DTOs (Add to API.DTOs namespace)
//namespace API.DTOs;

//public class CreateCommentDto
//{
//    public string Content { get; set; } = string.Empty;
//}

//public class UpdateCommentDto
//{
//    public string Content { get; set; } = string.Empty;
//}

//public class CommentResponseDto
//{
//    public string Id { get; set; } = string.Empty;
//    public string Content { get; set; } = string.Empty;
//    public string CreatedBy { get; set; } = string.Empty;
//    public string CreatedByName { get; set; } = string.Empty;
//    public DateTime CreatedAt { get; set; }
//    public DateTime? UpdatedAt { get; set; }
//    public bool CanEdit { get; set; } // To indicate if current user can edit this comment
//    public bool CanDelete { get; set; } // To indicate if current user can delete this comment
//}
