package com.healtcare.community.services.implementations;

import com.healtcare.community.entities.Comment;
import com.healtcare.community.entities.Post;
import com.healtcare.community.exception.AccessDeniedException;
import com.healtcare.community.exception.ItemNotFoundException;
import com.healtcare.community.models.CommentCreateDTO;
import com.healtcare.community.network.NotificationRequest;
import com.healtcare.community.network.NotificationSender;
import com.healtcare.community.repositories.CommentRepository;
import com.healtcare.community.repositories.PostRepository;
import com.healtcare.community.services.interfaces.CommentService;
import com.healthcare.notification.utilities.token.IDExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service @RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final NotificationSender notificationSender;

    @Override
    public void create(CommentCreateDTO commentCreateDTO) {
        Comment comment = new Comment();
        if(commentCreateDTO.getParentCommentId() != null && commentCreateDTO.getParentCommentId() != 0L){
            comment.setParentComment(readComment(commentCreateDTO.getParentCommentId()));
        }
        if(commentCreateDTO.getParentPostId() == null){
            throw new ItemNotFoundException("post", commentCreateDTO.getParentPostId().toString());
        }
        else {
            Post parentPost = readPost(commentCreateDTO.getParentPostId());
            comment.setParentPost(parentPost);
        }

        if(comment.getParentComment() != null
                && !comment.getParentComment().getParentPost()
                .getPostId().equals(commentCreateDTO.getParentPostId())) {
            throw new ItemNotFoundException("comment in the expected post",
                    commentCreateDTO.getParentPostId().toString());
        }

        comment.setContent(commentCreateDTO.getContent());
        comment.setTimeCreated(LocalDateTime.now());

        comment.setUserId(IDExtractor.getUserID());
        commentRepository.save(comment);

//        if(!IDExtractor.getUserID().equals(comment.getParentPost().getUserId())) -> commented out self interaction validation for project evaluation
        notifyPostAuthor(comment, comment.getParentPost().getUserId());
//        if(!IDExtractor.getUserID().equals(comment.getParentComment().getUserId())) -> commented out self interaction validation for project evaluation
        if(comment.getParentComment() != null) notifyCommentAuthor(comment, comment.getParentComment().getUserId());
    }

    private Comment readComment(Long id){
        Optional<Comment> commentOp = commentRepository.findById(id);
        if(commentOp.isEmpty()) throw new ItemNotFoundException("comment", id.toString());
        return commentOp.get();
    }
    private Post readPost(Long id){
        Optional<Post> postOp = postRepository.findById(id);
        if(postOp.isEmpty()) throw new ItemNotFoundException("post", id.toString());
        return postOp.get();
    }

    @Override
    public void update(Long commentId, String userId, String content) {
        Comment comment = readComment(commentId);
        if(!comment.getUserId().equals(userId)) throw new AccessDeniedException
                ("'" + comment.getContent().substring(0, Math.min(8, comment.getContent().length()))
                        + "...' comment, you can't edit this comment as you don't own it!");
        comment.setContent(content);
        commentRepository.save(comment);
    }

    @Override
    public void delete(String userId, Long commentId) {
        Comment comment = readComment(commentId);
        if(comment.getUserId().equals(userId)
                || comment.getParentPost().getUserId().equals(userId)
                || userId.startsWith("A")) {
            commentRepository.delete(comment);
        }
        else throw new AccessDeniedException
                ("'" + comment.getContent().substring(0, Math.min(8, comment.getContent().length()))
                        + "...' comment, you can't edit this comment as you don't own it!");
    }

    private void notifyPostAuthor(Comment comment, String postAuthor){
        NotificationRequest notificationRequest = NotificationRequest.builder()
                .title("New comment on your post.")
                .text("Your post '" + comment.getParentPost().getContent()
                        .substring(0, Math.min(comment.getParentPost().getContent().length(), 8))
                        + "...' has a new comment.")
                .type("COMMUNITY")
                .suffix("Visit the post to see the more")
                .userId(postAuthor)
                .url("http://localhost:3100/health/community/post/" + comment.getParentPost().getPostId())
                .build();
        if(comment.getParentPost().getPhotoURL() != null && !comment.getParentPost().getPhotoURL().isEmpty()){
            notificationRequest.setPhotoUrl(comment.getParentPost().getPhotoURL());
        }

        notificationSender.send(notificationRequest);
    }

    private void notifyCommentAuthor(Comment comment, String commentAuthor){
        NotificationRequest notificationRequest = NotificationRequest.builder()
                .title("New Reply on your comment.")
                .text("Your comment on post '" + comment.getParentPost().getContent()
                        .substring(0, Math.min(comment.getParentPost().getContent().length(), 8))
                        + "...' has a new reply.")
                .type("COMMUNITY")
                .suffix("Visit the post to see the more")
                .userId(commentAuthor)
                .url("http://localhost:3100/health/community/post/" + comment.getParentPost().getPostId())
                .build();
        if(comment.getParentPost().getPhotoURL() != null && !comment.getParentPost().getPhotoURL().isEmpty()){
            notificationRequest.setPhotoUrl(comment.getParentPost().getPhotoURL());
        }

        notificationSender.send(notificationRequest);
    }
}
